"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Program, Exercise } from "@/lib/types";

const MUSCLE_LABELS: Record<string, string> = {
  legs: "Bacak", forearm: "Ön Kol", upperArm: "Üst Kol",
  shoulder: "Omuz", wrist: "Bilek", chest: "Göğüs", abs: "Karın", back: "Sırt",
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Başlangıç", intermediate: "Orta", expert: "İleri",
};

export default function ProgramDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [program, setProgram] = useState<Program | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [programRes, exercisesRes] = await Promise.all([
        fetch(`/api/programs/${id}`),
        fetch("/api/exercises?all=true"),
      ]);
      if (programRes.ok) setProgram(await programRes.json());
      if (exercisesRes.ok) setExercises(await exercisesRes.json());
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
        </div>
      </main>
    );
  }

  if (!program) {
    return (
      <main className="max-w-2xl mx-auto p-6 flex flex-col gap-4">
        <Button variant="ghost" size="sm" className="self-start -ml-2" onClick={() => router.back()}>
          <ArrowLeft size={16} className="mr-1" /> Geri
        </Button>
        <p className="text-muted-foreground">Program bulunamadı.</p>
      </main>
    );
  }

  const exerciseMap = new Map(exercises.map((ex) => [ex.id, ex]));

  return (
    <main className="max-w-2xl mx-auto p-6 flex flex-col gap-6 pb-16">
      <Button variant="ghost" size="sm" className="self-start -ml-2" onClick={() => router.back()}>
        <ArrowLeft size={16} className="mr-1" /> Geri
      </Button>

      <h1 className="text-2xl font-bold leading-tight">{program.name}</h1>

      {program.exercises.length === 0 ? (
        <p className="text-muted-foreground text-sm">Bu programda henüz egzersiz yok.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {program.exercises.map((pe) => {
            const ex = exerciseMap.get(pe.exerciseId);
            return (
              <Link
                key={pe.exerciseId}
                href={`/exercises/${pe.exerciseId}`}
                className="rounded-lg border bg-card p-4 flex items-center justify-between gap-4 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex flex-col gap-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{ex?.name ?? "Bilinmeyen"}</span>
                    <Badge variant="outline" className="text-xs">
                      {MUSCLE_LABELS[pe.muscleGroup] ?? pe.muscleGroup}
                    </Badge>
                    {ex?.level && (
                      <Badge variant="secondary" className="text-xs">
                        {LEVEL_LABELS[ex.level] ?? ex.level}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {pe.targetSets} set
                    {pe.targetReps > 0 && ` · ${pe.targetReps} tekrar`}
                    {pe.targetWeight > 0 && ` · ${pe.targetWeight} kg`}
                  </p>
                </div>
                <ExternalLink size={15} className="shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
