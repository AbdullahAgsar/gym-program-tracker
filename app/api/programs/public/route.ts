import { NextRequest, NextResponse } from "next/server";
import { readJSON } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { Program, User } from "@/lib/types";

export interface PublicProgram extends Program {
  username: string;
}

export interface PublicProgramsResponse {
  data: PublicProgram[];
  total: number;
  hasMore: boolean;
}

const LIMIT = 15;

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const page = Math.max(0, Number(new URL(request.url).searchParams.get("page") ?? 0));

  const programs = readJSON<Program>("programs.json");
  const users = readJSON<User>("users.json");
  const userMap = new Map(users.map((u) => [u.id, u.username]));

  const all: PublicProgram[] = programs
    .filter((p) => p.isPublic && p.userId !== session.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((p) => ({ ...p, username: userMap.get(p.userId) ?? "Bilinmeyen" }));

  const start = page * LIMIT;
  const data = all.slice(start, start + LIMIT);

  return NextResponse.json({ data, total: all.length, hasMore: start + LIMIT < all.length });
}
