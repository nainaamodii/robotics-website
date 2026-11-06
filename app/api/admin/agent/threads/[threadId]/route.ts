import { NextRequest, NextResponse } from "next/server";
import { getThread, deleteThread } from "@/lib/admin-agent/thread-store";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  const thread = await getThread(threadId);
  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ thread });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  await deleteThread(threadId);
  return NextResponse.json({ success: true });
}