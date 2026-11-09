import { NextResponse } from "next/server";
import { pingDB } from "@/lib/db/connect";
import { isFirebaseConfigured } from "@/lib/env";

export async function GET() {
  const db = await pingDB();
  return NextResponse.json({
    ok: true,
    db,
    firebase: { configured: isFirebaseConfigured() },
    timestamp: new Date().toISOString(),
  });
}
