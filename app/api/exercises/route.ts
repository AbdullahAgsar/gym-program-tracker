import { NextRequest, NextResponse } from "next/server";
import { readJSON, writeJSON, generateId } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { MUSCLE_GROUPS } from "@/lib/constants";
import type { Exercise } from "@/lib/types";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const muscleGroup = searchParams.get("muscleGroup");
  const level = searchParams.get("level");
  const search = searchParams.get("search")?.toLowerCase();
  const page = Math.max(0, Number(searchParams.get("page") ?? 0));
  const limit = 15;

  const exercises = readJSON<Exercise>("exercises.json");

  const filtered = exercises.filter((ex) => {
    // personal: sadece sahibi görebilir; global: approved olanlar herkes görür
    const visible =
      ex.scope === "personal"
        ? ex.createdBy === session.id
        : ex.status === "approved" || session.role === "admin";

    if (!visible) return false;
    if (muscleGroup && ex.muscleGroup !== muscleGroup) return false;
    if (level && ex.level !== level) return false;
    if (search && !ex.name.toLowerCase().includes(search)) return false;

    return true;
  });

  if (searchParams.get("all") === "true") {
    return NextResponse.json(filtered);
  }

  const start = page * limit;
  const data = filtered.slice(start, start + limit);

  return NextResponse.json({ data, hasMore: start + limit < filtered.length });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body?.name || !body?.muscleGroup || !body?.scope) {
    return NextResponse.json(
      { error: "name, muscleGroup ve scope zorunludur." },
      { status: 400 }
    );
  }

  if (!MUSCLE_GROUPS.includes(body.muscleGroup)) {
    return NextResponse.json({ error: "Geçersiz kas grubu." }, { status: 400 });
  }

  if (!["global", "personal"].includes(body.scope)) {
    return NextResponse.json({ error: "Geçersiz kapsam." }, { status: 400 });
  }

  const exercises = readJSON<Exercise>("exercises.json");

  const newExercise: Exercise = {
    id: generateId(),
    name: body.name.trim(),
    muscleGroup: body.muscleGroup,
    mediaUrl: body.mediaUrl ?? undefined,
    mediaType: body.mediaType ?? undefined,
    scope: body.scope,
    // global egzersizler admin onayı bekler; personal direkt approved
    status: body.scope === "personal" ? "approved" : "pending",
    createdBy: session.id,
    ratings: [],
    createdAt: new Date().toISOString(),
  };

  exercises.push(newExercise);
  writeJSON("exercises.json", exercises);

  return NextResponse.json(newExercise, { status: 201 });
}
