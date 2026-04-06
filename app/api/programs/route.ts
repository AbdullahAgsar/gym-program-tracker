import { NextRequest, NextResponse } from "next/server";
import { db, generateId, j } from "@/lib/db";
import { programs, mapProgram } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const rows = db.select().from(programs).where(eq(programs.userId, session.id)).all();

  return NextResponse.json(rows.map(mapProgram));
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body?.name || !Array.isArray(body?.exercises)) {
    return NextResponse.json(
      { error: "name ve exercises zorunludur." },
      { status: 400 }
    );
  }

  const id = generateId();
  const now = new Date().toISOString();

  db.insert(programs).values({
    id,
    userId: session.id,
    name: body.name.trim(),
    exercises: j(body.exercises),
    ratings: j([]),
    isPublic: false,
    createdAt: now,
  }).run();

  const row = db.select().from(programs).where(eq(programs.id, id)).get()!;

  return NextResponse.json(mapProgram(row), { status: 201 });
}
