import { NextRequest, NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { Program } from "@/lib/types";

export async function POST(
  _request: NextRequest,
  ctx: RouteContext<"/api/programs/[id]/publish">
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

  if (programs[index].userId !== session.id) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  programs[index] = { ...programs[index], isPublic: !programs[index].isPublic };
  writeJSON("programs.json", programs);

  return NextResponse.json({ isPublic: programs[index].isPublic });
}
