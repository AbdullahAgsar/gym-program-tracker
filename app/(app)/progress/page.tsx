"use client";

import { useEffect, useState } from "react";
import { ExerciseTrend } from "@/components/progress/ExerciseTrend";
import { MuscleGroupFilter } from "@/components/exercises/MuscleGroupFilter";
import type { Exercise, Log } from "@/lib/types";
import type { ProgressResult } from "@/lib/progress";
import { calcProgress } from "@/lib/progress";

export default function ProgressPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [muscleGroup, setMuscleGroup] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/exercises?all=true").then((r) => r.json()),
      fetch("/api/logs").then((r) => r.json()),
    ]).then(([exData, logData]) => {
      if (Array.isArray(exData)) setExercises(exData);
      if (Array.isArray(logData)) setLogs(logData);
    });
  }, []);

  const exerciseMap = new Map(exercises.map((ex) => [ex.id, ex]));

  // Log'larda geçen tüm egzersiz ID'lerini topla (exercises.json'da olmasa bile)
  const allUsedIds = [
    ...new Set(logs.flatMap((l) => l.exercises.map((e) => e.exerciseId))),
  ];

  const results: (ProgressResult & { name: string; muscleGroupKey: string | null })[] =
    allUsedIds
      .map((id) => {
        const ex = exerciseMap.get(id);
        const progress = calcProgress(id, logs);
        // En az bir session ile ağırlık verisi olmayan egzersizleri gizle
        if (progress.sessions.length === 0) return null;
        return {
          ...progress,
          name: ex?.name ?? "Bilinmeyen Egzersiz",
          muscleGroupKey: ex?.muscleGroup ?? null,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .filter(
        (r) => muscleGroup === null || r.muscleGroupKey === muscleGroup
      );

  return (
    <main className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Gelişim Takibi</h1>

      <MuscleGroupFilter value={muscleGroup} onChange={setMuscleGroup} />

      {results.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Henüz kayıtlı antrenman verisi yok.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {results.map((r) => (
            <ExerciseTrend key={r.exerciseId} result={r} exerciseName={r.name} />
          ))}
        </div>
      )}
    </main>
  );
}
