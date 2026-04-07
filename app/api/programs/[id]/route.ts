import { NextRequest, NextResponse } from "next/server";
import { db, j } from "@/lib/db";
import { programs, mapProgram } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/programs/[id]">
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

  return NextResponse.json(mapProgram(row));
}

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/programs/[id]">
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

  const program = mapProgram(row);

  if (program.userId !== session.id && session.role !== "admin") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  db.update(programs).set({
    name: body.name?.trim() ?? program.name,
    exercises: body.exercises !== undefined ? j(body.exercises) : row.exercises,
  }).where(eq(programs.id, id)).run();

  const updatedRow = db.select().from(programs).where(eq(programs.id, id)).get()!;
  return NextResponse.json(mapProgram(updatedRow));
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/programs/[id]">
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

  const program = mapProgram(row);

  if (program.userId !== session.id && session.role !== "admin") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  db.delete(programs).where(eq(programs.id, id)).run();

  return NextResponse.json({ ok: true });
}
