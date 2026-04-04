import { NextRequest, NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { Program } from "@/lib/types";

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

  const programs = readJSON<Program>("programs.json");
  const index = programs.findIndex((p) => p.id === id);

  if (index === -1) {
    return NextResponse.json({ error: "Program bulunamadı." }, { status: 404 });
  }

  // Kendi programını puanlayamazsın
  if (programs[index].userId === session.id) {
    return NextResponse.json(
      { error: "Kendi programını puanlayamazsın." },
      { status: 403 }
    );
  }

  const ratings = programs[index].ratings ?? [];
  const existingIndex = ratings.findIndex((r) => r.userId === session.id);

  if (existingIndex !== -1) {
    // Güncelle
    ratings[existingIndex] = {
      userId: session.id,
      rating,
      createdAt: new Date().toISOString(),
    };
  } else {
    // Yeni ekle
    ratings.push({
      userId: session.id,
      rating,
      createdAt: new Date().toISOString(),
    });
  }

  programs[index] = { ...programs[index], ratings };
  writeJSON("programs.json", programs);

  const avg =
    ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

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
  const programs = readJSON<Program>("programs.json");
  const index = programs.findIndex((p) => p.id === id);

  if (index === -1) {
    return NextResponse.json({ error: "Program bulunamadı." }, { status: 404 });
  }

  const ratings = (programs[index].ratings ?? []).filter(
    (r) => r.userId !== session.id
  );

  programs[index] = { ...programs[index], ratings };
  writeJSON("programs.json", programs);

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
