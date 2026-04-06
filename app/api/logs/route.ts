import { NextRequest, NextResponse } from "next/server";
import { db, generateId, j } from "@/lib/db";
import { logs, mapLog } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const rows = db.select().from(logs).where(eq(logs.userId, session.id)).all();

  return NextResponse.json(rows.map(mapLog));
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.date) {
    return NextResponse.json({ error: "date zorunludur." }, { status: 400 });
  }

  // Aynı gün için zaten log varsa hata dön
  const existing = db
    .select()
    .from(logs)
    .where(and(eq(logs.userId, session.id), eq(logs.date, body.date)))
    .get();

  if (existing) {
    return NextResponse.json(
      { error: "Bu gün için zaten kayıt var." },
      { status: 409 }
    );
  }

  const id = generateId();
  const now = new Date().toISOString();

  db.insert(logs).values({
    id,
    userId: session.id,
    date: body.date,
    programIds: j(body.programIds ?? []),
    exercises: j(body.exercises ?? []),
    createdAt: now,
  }).run();

  const row = db.select().from(logs).where(eq(logs.id, id)).get()!;

  return NextResponse.json(mapLog(row), { status: 201 });
}
