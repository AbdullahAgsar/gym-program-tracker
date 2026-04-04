import type { Log } from "./types";

export interface ProgressResult {
  exerciseId: string;
  currentMax: number | null;
  previousMax: number | null;
  delta: number | null;
  message: string;
  sessions: { date: string; maxWeight: number }[];
}

export function calcProgress(
  exerciseId: string,
  logs: Log[]
): ProgressResult {
  // Sadece bu egzersizi içeren log'ları tarih sırasına göre sırala
  const relevant = logs
    .filter((log) => log.exercises.some((ex) => ex.exerciseId === exerciseId))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Her seans için max ağırlığı hesapla (sadece done:true olanlar)
  const sessions = relevant
    .map((log) => {
      const ex = log.exercises.find((e) => e.exerciseId === exerciseId);
      if (!ex) return null;
      const weights = ex.sets
        .filter((s) => s.done && s.weight !== undefined)
        .map((s) => s.weight as number);
      if (weights.length === 0) return null;
      return { date: log.date, maxWeight: Math.max(...weights) };
    })
    .filter((s): s is { date: string; maxWeight: number } => s !== null);

  if (sessions.length === 0) {
    return {
      exerciseId,
      currentMax: null,
      previousMax: null,
      delta: null,
      message: "Henüz karşılaştırılacak yeterli veri yok.",
      sessions: [],
    };
  }

  if (sessions.length === 1) {
    return {
      exerciseId,
      currentMax: sessions[0].maxWeight,
      previousMax: null,
      delta: null,
      message: "Henüz karşılaştırılacak yeterli veri yok.",
      sessions,
    };
  }

  const current = sessions[sessions.length - 1].maxWeight;
  const previous = sessions[sessions.length - 2].maxWeight;
  const delta = current - previous;

  let message: string;
  if (delta > 0) {
    message = `+${delta}kg ↑ — Güçleniyorsun, devam et!`;
  } else if (delta < 0) {
    message = `${delta}kg ↓ — Geçen seferden biraz düşük, sorun değil.`;
  } else {
    message = "= Aynı ağırlık — Plateau kırma zamanı olabilir.";
  }

  return { exerciseId, currentMax: current, previousMax: previous, delta, message, sessions };
}
