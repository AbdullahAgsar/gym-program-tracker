import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { exercises, mapExercise } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { MUSCLE_GROUPS, EXERCISE_STATUSES } from "@/lib/constants";

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/exercises/[id]">
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await ctx.params;
  const row = db.select().from(exercises).where(eq(exercises.id, id)).get();

  if (!row) return NextResponse.json({ error: "Egzersiz bulunamadı." }, { status: 404 });

  const exercise = mapExercise(row);
  const visible =
    exercise.scope === "personal"
      ? exercise.createdBy === session.id
      : exercise.status === "approved" || session.role === "admin";

  if (!visible) return NextResponse.json({ error: "Egzersiz bulunamadı." }, { status: 404 });

  return NextResponse.json(exercise);
}

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/exercises/[id]">
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const row = db.select().from(exercises).where(eq(exercises.id, id)).get();

  if (!row) {
    return NextResponse.json({ error: "Egzersiz bulunamadı." }, { status: 404 });
  }

  const exercise = mapExercise(row);

  if (exercise.createdBy !== session.id && session.role !== "admin") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  if (body.muscleGroup && !MUSCLE_GROUPS.includes(body.muscleGroup)) {
    return NextResponse.json({ error: "Geçersiz kas grubu." }, { status: 400 });
  }

  if (body.status && !EXERCISE_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Geçersiz status." }, { status: 400 });
  }

  if (body.status && session.role !== "admin") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  db.update(exercises).set({
    name: body.name?.trim() ?? exercise.name,
    muscleGroup: body.muscleGroup ?? exercise.muscleGroup,
    level: body.level ?? exercise.level ?? null,
    equipment: body.equipment ?? exercise.equipment ?? null,
    mediaUrl: body.mediaUrl ?? exercise.mediaUrl ?? null,
    mediaType: body.mediaType ?? exercise.mediaType ?? null,
    status: body.status ?? exercise.status,
  }).where(eq(exercises.id, id)).run();

  const updatedRow = db.select().from(exercises).where(eq(exercises.id, id)).get()!;
  return NextResponse.json(mapExercise(updatedRow));
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/exercises/[id]">
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const row = db.select().from(exercises).where(eq(exercises.id, id)).get();

  if (!row) {
    return NextResponse.json({ error: "Egzersiz bulunamadı." }, { status: 404 });
  }

  const exercise = mapExercise(row);

  if (exercise.createdBy !== session.id && session.role !== "admin") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  db.delete(exercises).where(eq(exercises.id, id)).run();

  return NextResponse.json({ ok: true });
}
