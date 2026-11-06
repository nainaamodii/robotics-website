import { NextRequest, NextResponse } from "next/server";
import { listThreads } from "@/lib/admin-agent/thread-store";

export async function GET(req: NextRequest) {
  const adminId = req.nextUrl.searchParams.get("adminId");
  if (!adminId) return NextResponse.json({ error: "adminId is required" }, { status: 400 });

  const threads = await listThreads(adminId);
  return NextResponse.json({ threads });
}
