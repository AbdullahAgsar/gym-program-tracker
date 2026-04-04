import { NextRequest, NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { MUSCLE_GROUPS, EXERCISE_STATUSES } from "@/lib/constants";
import type { Exercise } from "@/lib/types";

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/exercises/[id]">
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await ctx.params;
  const exercises = readJSON<Exercise>("exercises.json");
  const exercise = exercises.find((ex) => ex.id === id);

  if (!exercise) return NextResponse.json({ error: "Egzersiz bulunamadı." }, { status: 404 });

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
  const exercises = readJSON<Exercise>("exercises.json");
  const index = exercises.findIndex((ex) => ex.id === id);

  if (index === -1) {
    return NextResponse.json({ error: "Egzersiz bulunamadı." }, { status: 404 });
  }

  const exercise = exercises[index];

  // Sadece sahibi veya admin düzenleyebilir
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

  // Status değişikliği sadece admin yapabilir
  if (body.status && session.role !== "admin") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const updated: Exercise = {
    ...exercise,
    name: body.name?.trim() ?? exercise.name,
    muscleGroup: body.muscleGroup ?? exercise.muscleGroup,
    level: body.level ?? exercise.level,
    equipment: body.equipment ?? exercise.equipment,
    mediaUrl: body.mediaUrl ?? exercise.mediaUrl,
    mediaType: body.mediaType ?? exercise.mediaType,
    status: body.status ?? exercise.status,
  };

  exercises[index] = updated;
  writeJSON("exercises.json", exercises);

  return NextResponse.json(updated);
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
  const exercises = readJSON<Exercise>("exercises.json");
  const exercise = exercises.find((ex) => ex.id === id);

  if (!exercise) {
    return NextResponse.json({ error: "Egzersiz bulunamadı." }, { status: 404 });
  }

  if (exercise.createdBy !== session.id && session.role !== "admin") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const remaining = exercises.filter((ex) => ex.id !== id);
  writeJSON("exercises.json", remaining);

  return NextResponse.json({ ok: true });
}
