/**
 * One-time (per-issue) batch ingestion for the club magazine RAG pipeline.
 *
 * Pipeline: PDF -> rasterize each page (pdftoppm) -> Gemini vision
 * transcription (structured markdown) -> chunk by article boundary ->
 * Gemini embeddings -> upsert into `magazine_chunks`.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/ingest-magazine.ts "resources/Pragati 25.pdf" --year=2025 --issueId=pragati-25
 *
 * Requires: poppler installed (pdftoppm on PATH), GEMINI_API_KEY in env.
 * Idempotent: re-running upserts on (year, issueId, pageNumber, chunkIndex),
 * so fixing a bad transcription and re-running is safe. Pages that already
 * have chunks in the DB are skipped entirely on resume (see --force to
 * override).
 */
import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local", override: true });

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readdir, readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { GoogleGenerativeAI, type EmbedContentRequest } from "@google/generative-ai";
import { getDB } from "../lib/db"; // adjust relative path if your scripts/ layout differs

const execFileAsync = promisify(execFile);

// ---------- CLI args ----------

const [, , pdfPathArg, ...rest] = process.argv;
const flags = Object.fromEntries(
  rest
    .filter((f) => f.startsWith("--"))
    .map((f) => {
      const [k, v] = f.replace(/^--/, "").split("=");
      return [k, v ?? "true"];
    }),
);

if (!pdfPathArg || !flags.year || !flags.issueId) {
  console.error(
    'Usage: npx tsx scripts/ingest-magazine.ts "<pdf path>" --year=2025 --issueId=pragati-25 [--force]',
  );
  process.exit(1);
}

const YEAR = parseInt(flags.year, 10);
const ISSUE_ID = flags.issueId;
const PDF_PATH = path.resolve(pdfPathArg);
const FORCE = flags.force === "true";

// ---------- Gemini setup ----------

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is not set.");
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(apiKey);

// "gemini-flash-latest" tracks Google's current stable Flash model so this
// script doesn't need to be updated every time they cycle model versions.
// Pin to an explicit version (e.g. "gemini-3.6-flash") instead if you want
// fully reproducible transcription output across re-runs.
const visionModel = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

// Replacement for the retired text-embedding-004. Outputs 3072-dim vectors
// by default (vs. 768 for the old model) -- make sure your Atlas Vector
// Search index's numDimensions matches, or pass outputDimensionality below.
const embedModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
const EMBEDDING_OUTPUT_DIMENSIONALITY: number | undefined = undefined; // e.g. 768 to match an old index

const TRANSCRIBE_PROMPT = `Transcribe this magazine page into markdown.
- Preserve headings for distinct articles/sections using "## " prefixes.
- Preserve captions under images as italic text.
- If a section clearly continues from a previous page, start with "(continued)".
- If the page has no readable text (e.g. a cover photo, ad, blank divider), respond with exactly: NO_TEXT_CONTENT
- Do not add commentary, only the transcription.`;

const NO_TEXT_CONTENT = "NO_TEXT_CONTENT";
const RECITATION_BLOCKED = "RECITATION_BLOCKED";

// ---------- helpers ----------

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 2000): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      console.warn(`  retry ${i + 1}/${attempts} after error:`, err instanceof Error ? err.message : err);
      await sleep(delayMs * (i + 1));
    }
  }
  throw lastErr;
}

async function rasterizePdf(pdfPath: string, outDir: string): Promise<string[]> {
  console.log("Rasterizing PDF pages (150 DPI)...");
  await execFileAsync("pdftoppm", ["-png", "-r", "150", pdfPath, path.join(outDir, "page")]);
  const files = (await readdir(outDir)).filter((f) => f.endsWith(".png")).sort();
  return files.map((f) => path.join(outDir, f));
}

async function transcribePage(imagePath: string): Promise<string> {
  const imageBytes = await readFile(imagePath);
  try {
    const result = await withRetry(() =>
      visionModel.generateContent([
        { inlineData: { data: imageBytes.toString("base64"), mimeType: "image/png" } },
        { text: TRANSCRIBE_PROMPT },
      ]),
    );
    return result.response.text().trim();
  } catch (err) {
    // RECITATION blocks are not transient -- retrying won't help, so treat
    // this page as needing manual attention instead of crashing the batch.
    if (err instanceof Error && err.message.includes("RECITATION")) {
      console.warn("  blocked by RECITATION filter; flagging for manual transcription.");
      return RECITATION_BLOCKED;
    }
    throw err;
  }
}

function chunkByArticle(markdown: string): { title?: string; text: string }[] {
  if (markdown === NO_TEXT_CONTENT || !markdown) return [];

  const lines = markdown.split("\n");
  const chunks: { title?: string; text: string }[] = [];
  let currentTitle: string | undefined;
  let currentLines: string[] = [];

  const flush = () => {
    const text = currentLines.join("\n").trim();
    if (text) chunks.push({ title: currentTitle, text });
    currentLines = [];
  };

  for (const line of lines) {
    if (line.startsWith("## ")) {
      flush();
      currentTitle = line.replace(/^##\s+/, "").trim();
    }
    currentLines.push(line);
  }
  flush();

  // No headings found at all -> whole page is one chunk.
  return chunks.length > 0 ? chunks : [{ text: markdown.trim() }];
}

async function embed(text: string): Promise<number[]> {
  const result = await withRetry(() =>
    embedModel.embedContent(
      EMBEDDING_OUTPUT_DIMENSIONALITY
        ? {
            content: { role: "user", parts: [{ text }] },
            outputDimensionality: EMBEDDING_OUTPUT_DIMENSIONALITY,
            // The REST API accepts outputDimensionality; the SDK's request type omits it.
          } as EmbedContentRequest
        : text,
    ),
  );
  return result.embedding.values;
}

// ---------- main ----------

async function main() {
  const db = await getDB();
  const collection = db.collection("magazine_chunks");

  // Resume support: skip pages that already have chunks in the DB unless
  // --force is passed. Saves API calls when resuming after a crash.
  const alreadyIngestedPages = new Set<number>();
  if (!FORCE) {
    const existing = await collection
      .find({ year: YEAR, issueId: ISSUE_ID }, { projection: { pageNumber: 1 } })
      .toArray();
    for (const doc of existing) alreadyIngestedPages.add(doc.pageNumber as number);
    if (alreadyIngestedPages.size > 0) {
      console.log(
        `Resuming: ${alreadyIngestedPages.size} page(s) already ingested, will be skipped. Use --force to re-process everything.`,
      );
    }
  }

  const tmpDir = await mkdtemp(path.join(tmpdir(), "magazine-"));
  try {
    const pageImages = await rasterizePdf(PDF_PATH, tmpDir);
    console.log(`Found ${pageImages.length} pages.`);

    let totalChunks = 0;
    const flaggedPages: number[] = [];

    for (let i = 0; i < pageImages.length; i++) {
      const pageNumber = i + 1;

      if (alreadyIngestedPages.has(pageNumber)) {
        console.log(`\nPage ${pageNumber}/${pageImages.length}... already ingested, skipping.`);
        continue;
      }

      console.log(`\nPage ${pageNumber}/${pageImages.length}...`);

      const transcript = await transcribePage(pageImages[i]);

      if (transcript === NO_TEXT_CONTENT) {
        console.log("  no text content, skipping.");
        continue;
      }
      if (transcript === RECITATION_BLOCKED) {
        console.log(`  page ${pageNumber} blocked by recitation filter -- needs manual transcription.`);
        flaggedPages.push(pageNumber);
        continue;
      }

      const chunks = chunkByArticle(transcript);
      console.log(`  ${chunks.length} chunk(s).`);

      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        const { title, text } = chunks[chunkIndex];
        const embedding = await embed(text);

        await collection.updateOne(
          { year: YEAR, issueId: ISSUE_ID, pageNumber, chunkIndex },
          {
            $set: {
              year: YEAR,
              issueId: ISSUE_ID,
              pageNumber,
              chunkIndex,
              articleTitle: title,
              text,
              embedding,
              updatedAt: new Date(),
            },
            $setOnInsert: { createdAt: new Date() },
          },
          { upsert: true },
        );
        totalChunks++;

        // Gentle pacing to stay well under free-tier rate limits.
        await sleep(500);
      }
    }

    console.log(`\nDone. Upserted ${totalChunks} chunks for ${ISSUE_ID} (${YEAR}).`);
    if (flaggedPages.length > 0) {
      console.log(
        `\n${flaggedPages.length} page(s) need manual transcription (blocked by recitation filter): ${flaggedPages.join(", ")}`,
      );
    }
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Ingestion failed:", err);
  process.exit(1);
});