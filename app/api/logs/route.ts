import { NextRequest, NextResponse } from "next/server";
import { readJSON, writeJSON, generateId } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { Log } from "@/lib/types";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const logs = readJSON<Log>("logs.json");
  const mine = logs.filter((l) => l.userId === session.id);

  return NextResponse.json(mine);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.date) {
    return NextResponse.json({ error: "date zorunludur." }, { status: 400 });
  }

  const logs = readJSON<Log>("logs.json");

  // Aynı gün için zaten log varsa hata dön
  const existing = logs.find(
    (l) => l.userId === session.id && l.date === body.date
  );
  if (existing) {
    return NextResponse.json(
      { error: "Bu gün için zaten kayıt var." },
      { status: 409 }
    );
  }

  const newLog: Log = {
    id: generateId(),
    userId: session.id,
    date: body.date,
    programIds: body.programIds ?? [],
    exercises: body.exercises ?? [],
    createdAt: new Date().toISOString(),
  };

  logs.push(newLog);
  writeJSON("logs.json", logs);

  return NextResponse.json(newLog, { status: 201 });
}
