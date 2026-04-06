import { NextRequest, NextResponse } from "next/server";
import { db, generateId, j } from "@/lib/db";
import { programs, mapProgram } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function POST(
  _request: NextRequest,
  ctx: RouteContext<"/api/programs/[id]/save">
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const row = db.select().from(programs).where(eq(programs.id, id)).get();

  if (!row) {
    return NextResponse.json({ error: "Program bulunamadı." }, { status: 404 });
  }

  if (!row.isPublic) {
    return NextResponse.json({ error: "Bu program herkese açık değil." }, { status: 403 });
  }

  if (row.userId === session.id) {
    return NextResponse.json({ error: "Kendi programını tekrar kaydedemezsin." }, { status: 400 });
  }

  const newId = generateId();
  const now = new Date().toISOString();

  db.insert(programs).values({
    id: newId,
    userId: session.id,
    name: row.name,
    exercises: row.exercises,
    ratings: j([]),
    isPublic: false,
    createdAt: now,
  }).run();

  const newRow = db.select().from(programs).where(eq(programs.id, newId)).get()!;

  return NextResponse.json(mapProgram(newRow), { status: 201 });
}
