import { NextRequest, NextResponse } from "next/server";
import { readJSON, writeJSON, generateId } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { Log } from "@/lib/types";

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/logs/[date]">
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const { date } = await ctx.params;
  const logs = readJSON<Log>("logs.json");
  const log = logs.find((l) => l.userId === session.id && l.date === date);

  if (!log) {
    return NextResponse.json(null);
  }

  return NextResponse.json(log);
}

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/logs/[date]">
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const { date } = await ctx.params;
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const logs = readJSON<Log>("logs.json");
  const index = logs.findIndex(
    (l) => l.userId === session.id && l.date === date
  );

  if (index === -1) {
    // Log yoksa oluştur
    const newLog: Log = {
      id: generateId(),
      userId: session.id,
      date,
      programIds: body.programIds ?? [],
      exercises: body.exercises ?? [],
      createdAt: new Date().toISOString(),
    };
    logs.push(newLog);
    writeJSON("logs.json", logs);
    return NextResponse.json(newLog);
  }

  const updated: Log = {
    ...logs[index],
    programIds: body.programIds ?? logs[index].programIds,
    exercises: body.exercises ?? logs[index].exercises,
  };

  logs[index] = updated;
  writeJSON("logs.json", logs);

  return NextResponse.json(updated);
}
