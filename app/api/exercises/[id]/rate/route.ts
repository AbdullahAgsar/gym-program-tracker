import { NextRequest, NextResponse } from "next/server";
import { db, j } from "@/lib/db";
import { exercises } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import type { ExerciseRating } from "@/lib/types";

export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/exercises/[id]/rate">
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const rating = Number(body?.rating);

  if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    return NextResponse.json({ error: "Rating 1-5 arasında tam sayı olmalıdır." }, { status: 400 });
  }

  const row = db.select().from(exercises).where(eq(exercises.id, id)).get();
  if (!row) return NextResponse.json({ error: "Egzersiz bulunamadı." }, { status: 404 });

  const ratings: ExerciseRating[] = JSON.parse(row.ratings ?? "[]");
  const existingIndex = ratings.findIndex((r) => r.userId === session.id);

  if (existingIndex !== -1) {
    ratings[existingIndex] = { userId: session.id, rating, createdAt: new Date().toISOString() };
  } else {
    ratings.push({ userId: session.id, rating, createdAt: new Date().toISOString() });
  }

  db.update(exercises).set({ ratings: j(ratings) }).where(eq(exercises.id, id)).run();

  const avg = ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;
  return NextResponse.json({ average: Math.round(avg * 10) / 10, count: ratings.length, userRating: rating });
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/exercises/[id]/rate">
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await ctx.params;
  const row = db.select().from(exercises).where(eq(exercises.id, id)).get();
  if (!row) return NextResponse.json({ error: "Egzersiz bulunamadı." }, { status: 404 });

  const ratings: ExerciseRating[] = (JSON.parse(row.ratings ?? "[]") as ExerciseRating[]).filter(
    (r) => r.userId !== session.id
  );

  db.update(exercises).set({ ratings: j(ratings) }).where(eq(exercises.id, id)).run();

  const avg = ratings.length > 0 ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : 0;
  return NextResponse.json({ average: Math.round(avg * 10) / 10, count: ratings.length, userRating: null });
}
