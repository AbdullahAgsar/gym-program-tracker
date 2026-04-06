import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logs, exercises, mapLog, mapExercise } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { calcProgress } from "@/lib/progress";

export interface RecentProgressEvent {
  exerciseId: string;
  exerciseName: string;
  date: string;
  maxWeight: number;
  delta: number | null; // önceki seans ile fark
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const logRows = db.select().from(logs).where(eq(logs.userId, session.id)).all();
  const exerciseRows = db.select().from(exercises).all();

  const userLogs = logRows.map(mapLog);
  const exerciseMap = new Map(exerciseRows.map(mapExercise).map((ex) => [ex.id, ex.name]));

  const events: RecentProgressEvent[] = [];

  const sorted = [...userLogs].sort((a, b) => b.date.localeCompare(a.date));

  for (const log of sorted) {
    for (const le of log.exercises) {
      const weights = le.sets
        .filter((s) => s.done && s.weight !== undefined && s.weight > 0)
        .map((s) => s.weight as number);

      if (weights.length === 0) continue;

      const maxWeight = Math.max(...weights);
      const progress = calcProgress(le.exerciseId, userLogs);

      const sessionIndex = progress.sessions.findIndex((s) => s.date === log.date);
      const prevSession = sessionIndex > 0 ? progress.sessions[sessionIndex - 1] : null;
      const delta = prevSession !== null ? maxWeight - prevSession.maxWeight : null;

      events.push({
        exerciseId: le.exerciseId,
        exerciseName: exerciseMap.get(le.exerciseId) ?? "Bilinmeyen",
        date: log.date,
        maxWeight,
        delta,
      });
    }

    if (events.length >= 5) break;
  }

  return NextResponse.json(events.slice(0, 5));
}
