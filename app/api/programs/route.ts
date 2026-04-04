import { NextRequest, NextResponse } from "next/server";
import { readJSON, writeJSON, generateId } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { Program } from "@/lib/types";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const programs = readJSON<Program>("programs.json");
  const mine = programs.filter((p) => p.userId === session.id);

  return NextResponse.json(mine);
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

  const programs = readJSON<Program>("programs.json");

  const newProgram: Program = {
    id: generateId(),
    userId: session.id,
    name: body.name.trim(),
    exercises: body.exercises,
    ratings: [],
    createdAt: new Date().toISOString(),
  };

  programs.push(newProgram);
  writeJSON("programs.json", programs);

  return NextResponse.json(newProgram, { status: 201 });
}
