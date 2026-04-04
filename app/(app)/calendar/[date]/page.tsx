"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { WorkoutLogger } from "@/components/logs/WorkoutLogger";
import { ChevronLeft } from "lucide-react";
import type { Log, Program, Exercise } from "@/lib/types";

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function DayPage() {
  const { date } = useParams<{ date: string }>();
  const [log, setLog] = useState<Log | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [logRes, programsRes, exercisesRes] = await Promise.all([
        fetch(`/api/logs/${date}`),
        fetch("/api/programs"),
        fetch("/api/exercises"),
      ]);

      const logData = logRes.ok ? await logRes.json() : null;
      const programsData = programsRes.ok ? await programsRes.json() : [];
      const exercisesData = exercisesRes.ok ? await exercisesRes.json() : [];

      setLog(logData);
      setPrograms(programsData);
      setExercises(exercisesData);
      setLoading(false);
    }
    load();
  }, [date]);

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <p className="text-muted-foreground text-sm">Yükleniyor…</p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button asChild size="icon" variant="ghost">
          <Link href="/calendar">
            <ChevronLeft size={18} />
          </Link>
        </Button>
        <h1 className="text-xl font-bold capitalize">{formatDate(date)}</h1>
      </div>

      <WorkoutLogger
        date={date}
        log={log}
        programs={programs}
        exercises={exercises}
        onSaved={setLog}
      />
    </main>
  );
}
