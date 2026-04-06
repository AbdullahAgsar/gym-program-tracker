import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { exercises } from "@/lib/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!Array.isArray(body?.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: "ids dizisi zorunludur." }, { status: 400 });
  }

  const idArray: string[] = body.ids;

  // Only approve global+pending exercises from the given IDs
  const result = db
    .update(exercises)
    .set({ status: "approved" })
    .where(
      and(
        inArray(exercises.id, idArray),
        eq(exercises.scope, "global"),
        eq(exercises.status, "pending")
      )
    )
    .run();

  return NextResponse.json({ approved: result.changes });
}
