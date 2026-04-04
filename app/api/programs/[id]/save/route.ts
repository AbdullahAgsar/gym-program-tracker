import { NextRequest, NextResponse } from "next/server";
import { readJSON, writeJSON, generateId } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { Program } from "@/lib/types";

export async function POST(
  _request: NextRequest,
  ctx: RouteContext<"/api/programs/[id]/save">
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const programs = readJSON<Program>("programs.json");
  const source = programs.find((p) => p.id === id);

  if (!source) {
    return NextResponse.json({ error: "Program bulunamadı." }, { status: 404 });
  }

  if (!source.isPublic) {
    return NextResponse.json({ error: "Bu program herkese açık değil." }, { status: 403 });
  }

  if (source.userId === session.id) {
    return NextResponse.json({ error: "Kendi programını tekrar kaydedemezsin." }, { status: 400 });
  }

  const copy: Program = {
    id: generateId(),
    userId: session.id,
    name: source.name,
    exercises: source.exercises,
    ratings: [],
    isPublic: false,
    createdAt: new Date().toISOString(),
  };

  programs.push(copy);
  writeJSON("programs.json", programs);

  return NextResponse.json(copy, { status: 201 });
}
