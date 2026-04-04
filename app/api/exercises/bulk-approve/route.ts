import { NextRequest, NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { Exercise } from "@/lib/types";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!Array.isArray(body?.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: "ids dizisi zorunludur." }, { status: 400 });
  }

  const idSet = new Set<string>(body.ids);
  const exercises = readJSON<Exercise>("exercises.json");

  let count = 0;
  const updated = exercises.map((ex) => {
    if (idSet.has(ex.id) && ex.scope === "global" && ex.status === "pending") {
      count++;
      return { ...ex, status: "approved" as const };
    }
    return ex;
  });

  writeJSON("exercises.json", updated);

  return NextResponse.json({ approved: count });
}
