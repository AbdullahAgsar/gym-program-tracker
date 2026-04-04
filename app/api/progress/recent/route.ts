import { NextResponse } from "next/server";
import { readJSON } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { calcProgress } from "@/lib/progress";
import type { Log, Exercise } from "@/lib/types";

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

  const logs = readJSON<Log>("logs.json").filter((l) => l.userId === session.id);
  const exercises = readJSON<Exercise>("exercises.json");
  const exerciseMap = new Map(exercises.map((ex) => [ex.id, ex.name]));

  // Her log'dan done=true ve weight>0 olan setler üret → (date, exerciseId, maxWeight)
  const events: RecentProgressEvent[] = [];

  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));

  for (const log of sorted) {
    for (const le of log.exercises) {
      const weights = le.sets
        .filter((s) => s.done && s.weight !== undefined && s.weight > 0)
        .map((s) => s.weight as number);

      if (weights.length === 0) continue;

      const maxWeight = Math.max(...weights);
      const progress = calcProgress(le.exerciseId, logs);

      // Bu seans, progress.sessions içinde nerede?
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
