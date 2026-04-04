import { NextRequest, NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { Exercise } from "@/lib/types";

export async function POST(
  _request: NextRequest,
  ctx: RouteContext<"/api/exercises/[id]/approve">
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const { id } = await ctx.params;
  const exercises = readJSON<Exercise>("exercises.json");
  const index = exercises.findIndex((ex) => ex.id === id);

  if (index === -1) {
    return NextResponse.json({ error: "Egzersiz bulunamadı." }, { status: 404 });
  }

  exercises[index] = { ...exercises[index], status: "approved" };
  writeJSON("exercises.json", exercises);

  return NextResponse.json(exercises[index]);
}
