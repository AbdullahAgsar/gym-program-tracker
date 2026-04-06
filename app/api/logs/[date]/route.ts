import { NextRequest, NextResponse } from "next/server";
import { db, generateId, j } from "@/lib/db";
import { logs, mapLog } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/logs/[date]">
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const { date } = await ctx.params;
  const row = db
    .select()
    .from(logs)
    .where(and(eq(logs.userId, session.id), eq(logs.date, date)))
    .get();

  if (!row) {
    return NextResponse.json(null);
  }

  return NextResponse.json(mapLog(row));
}

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/logs/[date]">
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const { date } = await ctx.params;
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const row = db
    .select()
    .from(logs)
    .where(and(eq(logs.userId, session.id), eq(logs.date, date)))
    .get();

  if (!row) {
    // Log yoksa oluştur
    const id = generateId();
    const now = new Date().toISOString();

    db.insert(logs).values({
      id,
      userId: session.id,
      date,
      programIds: j(body.programIds ?? []),
      exercises: j(body.exercises ?? []),
      createdAt: now,
    }).run();

    const newRow = db.select().from(logs).where(eq(logs.id, id)).get()!;
    return NextResponse.json(mapLog(newRow));
  }

  db.update(logs).set({
    programIds: body.programIds !== undefined ? j(body.programIds) : row.programIds,
    exercises: body.exercises !== undefined ? j(body.exercises) : row.exercises,
  }).where(and(eq(logs.userId, session.id), eq(logs.date, date))).run();

  const updatedRow = db
    .select()
    .from(logs)
    .where(and(eq(logs.userId, session.id), eq(logs.date, date)))
    .get()!;

  return NextResponse.json(mapLog(updatedRow));
}
