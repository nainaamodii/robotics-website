import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";
import { MongoClient } from "mongodb";

// Reuses the same MongoDB deployment ("robotics-club" db) in a dedicated
// database so checkpoints don't collide with your app collections.
let client: MongoClient | null = null;
let saver: MongoDBSaver | null = null;

export async function getCheckpointer(): Promise<MongoDBSaver> {
  if (saver) return saver;

  const uri = process.env.MONGO_URL;
  if (!uri) throw new Error("MONGO_URL not set");

  client = new MongoClient(uri);
  await client.connect();

  // NOTE: if you see a TS2322 "MongoClient is not assignable to MongoClient"
  // error here, it means npm installed two separate copies of the `mongodb`
  // package — one at your repo's node_modules/mongodb (used by your app's
  // lib/db.ts) and a second, possibly different-versioned copy nested inside
  // node_modules/@langchain/langgraph-checkpoint-mongodb/node_modules/mongodb.
  // Structurally they're the same class at runtime, so this is a real TS
  // duplicate-package issue, not a real bug — run `npm ls mongodb` to
  // confirm two versions show up, then either pin a matching version with
  // an `overrides` entry in package.json (npm) or `resolutions` (yarn) so
  // only one copy of `mongodb` gets installed, or run `npm dedupe`. The
  // cast below is a safe stopgap either way since the object is identical
  // at runtime regardless of which copy's types TS is checking against.
  saver = new MongoDBSaver({
    client: client as ConstructorParameters<typeof MongoDBSaver>[0]["client"],
    dbName: process.env.ADMIN_AGENT_CHECKPOINT_DB ?? "robotics-club-agent-checkpoints",
  });
  return saver;
}