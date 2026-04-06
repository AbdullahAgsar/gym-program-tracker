import { NextRequest, NextResponse } from "next/server";
import { db, j } from "@/lib/db";
import { programs } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import type { ProgramRating } from "@/lib/types";

export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/programs/[id]/rate">
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const rating = Number(body?.rating);

  if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    return NextResponse.json(
      { error: "Rating 1-5 arasında tam sayı olmalıdır." },
      { status: 400 }
    );
  }

  const row = db.select().from(programs).where(eq(programs.id, id)).get();

  if (!row) {
    return NextResponse.json({ error: "Program bulunamadı." }, { status: 404 });
  }

  if (row.userId === session.id) {
    return NextResponse.json(
      { error: "Kendi programını puanlayamazsın." },
      { status: 403 }
    );
  }

  const ratings: ProgramRating[] = JSON.parse(row.ratings ?? "[]");
  const existingIndex = ratings.findIndex((r) => r.userId === session.id);

  if (existingIndex !== -1) {
    ratings[existingIndex] = { userId: session.id, rating, createdAt: new Date().toISOString() };
  } else {
    ratings.push({ userId: session.id, rating, createdAt: new Date().toISOString() });
  }

  db.update(programs).set({ ratings: j(ratings) }).where(eq(programs.id, id)).run();

  const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

  return NextResponse.json({
    average: Math.round(avg * 10) / 10,
    count: ratings.length,
    userRating: rating,
  });
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/programs/[id]/rate">
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

  const ratings: ProgramRating[] = (JSON.parse(row.ratings ?? "[]") as ProgramRating[]).filter(
    (r) => r.userId !== session.id
  );

  db.update(programs).set({ ratings: j(ratings) }).where(eq(programs.id, id)).run();

  const avg =
    ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

  return NextResponse.json({
    average: Math.round(avg * 10) / 10,
    count: ratings.length,
    userRating: null,
  });
}
