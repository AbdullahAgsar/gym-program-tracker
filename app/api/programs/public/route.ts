import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { programs, users, mapProgram } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import type { Program } from "@/lib/types";

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

  const programRows = db.select().from(programs).where(eq(programs.isPublic, true)).all();
  const userRows = db.select().from(users).all();

  const userMap = new Map(userRows.map((u) => [u.id, u.username]));

  const all: PublicProgram[] = programRows
    .map(mapProgram)
    .filter((p) => p.userId !== session.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((p) => ({ ...p, username: userMap.get(p.userId) ?? "Bilinmeyen" }));

  const start = page * LIMIT;
  const data = all.slice(start, start + LIMIT);

  return NextResponse.json({ data, total: all.length, hasMore: start + LIMIT < all.length });
}
