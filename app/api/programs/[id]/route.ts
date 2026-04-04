import { NextRequest, NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { Program } from "@/lib/types";

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/programs/[id]">
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const programs = readJSON<Program>("programs.json");
  const index = programs.findIndex((p) => p.id === id);

  if (index === -1) {
    return NextResponse.json({ error: "Program bulunamadı." }, { status: 404 });
  }

  if (programs[index].userId !== session.id && session.role !== "admin") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const updated: Program = {
    ...programs[index],
    name: body.name?.trim() ?? programs[index].name,
    exercises: body.exercises ?? programs[index].exercises,
  };

  programs[index] = updated;
  writeJSON("programs.json", programs);

  return NextResponse.json(updated);
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
  const programs = readJSON<Program>("programs.json");
  const program = programs.find((p) => p.id === id);

  if (!program) {
    return NextResponse.json({ error: "Program bulunamadı." }, { status: 404 });
  }

  if (program.userId !== session.id && session.role !== "admin") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  writeJSON(
    "programs.json",
    programs.filter((p) => p.id !== id)
  );

  return NextResponse.json({ ok: true });
}
