import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { exercises, mapExercise } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function POST(
  _request: NextRequest,
  ctx: RouteContext<"/api/exercises/[id]/reject">
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const { id } = await ctx.params;
  const row = db.select().from(exercises).where(eq(exercises.id, id)).get();

  if (!row) {
    return NextResponse.json({ error: "Egzersiz bulunamadı." }, { status: 404 });
  }

  db.update(exercises).set({ status: "rejected" }).where(eq(exercises.id, id)).run();

  const updatedRow = db.select().from(exercises).where(eq(exercises.id, id)).get()!;
  return NextResponse.json(mapExercise(updatedRow));
}
