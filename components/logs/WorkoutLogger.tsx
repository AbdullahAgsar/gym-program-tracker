"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SetRow } from "./SetRow";
import { ChevronDown, ChevronUp, Plus, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Log, Program, Exercise, LogExercise, LogSet } from "@/lib/types";

const MUSCLE_LABELS: Record<string, string> = {
  legs: "Bacak", forearm: "Ön Kol", upperArm: "Üst Kol",
  shoulder: "Omuz", wrist: "Bilek", chest: "Göğüs", abs: "Karın", back: "Sırt",
};

interface Props {
  date: string;
  log: Log | null;
  programs: Program[];
  exercises: Exercise[];
  onSaved: (log: Log) => void;
}

export function WorkoutLogger({ date, log, programs, exercises, onSaved }: Props) {
  const [selectedProgramIds, setSelectedProgramIds] = useState<string[]>(
    log?.programIds ?? []
  );
  const [logExercises, setLogExercises] = useState<LogExercise[]>(
    log?.exercises ?? []
  );
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const exerciseMap = new Map(exercises.map((ex) => [ex.id, ex]));

  // Seçili programların egzersizlerini senkronize et
  useEffect(() => {
    const programExercises = selectedProgramIds.flatMap((pid) => {
      const prog = programs.find((p) => p.id === pid);
      return prog?.exercises ?? [];
    });

    setLogExercises((prev) => {
      const newEntries: LogExercise[] = [];

      for (const pe of programExercises) {
        const existing = prev.find(
          (le) => le.exerciseId === pe.exerciseId && le.programId === pe.exerciseId
            ? false
            : le.exerciseId === pe.exerciseId
        );

        if (existing) {
          newEntries.push(existing);
        } else {
          // Önceki log'dan geri yükle
          const fromLog = log?.exercises.find(
            (le) => le.exerciseId === pe.exerciseId
          );
          if (fromLog) {
            newEntries.push(fromLog);
          } else {
            // Yeni egzersiz — target set sayısı kadar boş set oluştur
            const sets: LogSet[] = Array.from(
              { length: pe.targetSets },
              (_, i) => ({
                setNumber: i + 1,
                reps: pe.targetReps > 0 ? pe.targetReps : undefined,
                weight: pe.targetWeight > 0 ? pe.targetWeight : undefined,
                done: false,
              })
            );
            newEntries.push({
              exerciseId: pe.exerciseId,
              programId: selectedProgramIds.find((pid) =>
                programs
                  .find((p) => p.id === pid)
                  ?.exercises.some((e) => e.exerciseId === pe.exerciseId)
              ) ?? "",
              completed: false,
              sets,
            });
          }
        }
      }

      return newEntries;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProgramIds]);

  function toggleProgram(pid: string) {
    setSelectedProgramIds((prev) =>
      prev.includes(pid) ? prev.filter((id) => id !== pid) : [...prev, pid]
    );
  }

  function updateSet(exerciseId: string, setIndex: number, updated: LogSet) {
    setLogExercises((prev) =>
      prev.map((le) => {
        if (le.exerciseId !== exerciseId) return le;
        const sets = le.sets.map((s, i) => (i === setIndex ? updated : s));
        const completed = sets.every((s) => s.done);
        return { ...le, sets, completed };
      })
    );
  }

  function addSet(exerciseId: string) {
    setLogExercises((prev) =>
      prev.map((le) => {
        if (le.exerciseId !== exerciseId) return le;
        const lastSet = le.sets[le.sets.length - 1];
        const newSet: LogSet = {
          setNumber: le.sets.length + 1,
          reps: lastSet?.reps,
          weight: lastSet?.weight,
          done: false,
        };
        return { ...le, sets: [...le.sets, newSet] };
      })
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/logs/${date}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programIds: selectedProgramIds,
          exercises: logExercises,
        }),
      });
      if (res.ok) {
        onSaved(await res.json());
        toast.success("Antrenman kaydedildi.");
      } else {
        const data = await res.json();
        toast.error(data.error ?? "Kaydedilemedi.");
      }
    } catch {
      toast.error("Sunucuya bağlanılamadı.");
    } finally {
      setSaving(false);
    }
  }

  const totalSets = logExercises.reduce((a, e) => a + e.sets.length, 0);
  const doneSets = logExercises.reduce(
    (a, e) => a + e.sets.filter((s) => s.done).length,
    0
  );
  const pct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Program seçimi */}
      <div className="flex flex-col gap-2">
        <h2 className="font-semibold text-sm">Program Seç</h2>
        {programs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Henüz program oluşturmadın.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {programs.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleProgram(p.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full border text-sm font-medium transition-colors",
                  selectedProgramIds.includes(p.id)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-muted"
                )}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tamamlanma yüzdesi */}
      {logExercises.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                pct === 100 ? "bg-green-500" : pct >= 50 ? "bg-yellow-400" : "bg-orange-400"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-sm font-medium tabular-nums">%{pct}</span>
        </div>
      )}

      {/* Egzersizler */}
      {logExercises.map((le) => {
        const ex = exerciseMap.get(le.exerciseId);
        const isCollapsed = collapsed[le.exerciseId];
        const exDone = le.sets.length > 0 && le.sets.every((s) => s.done);

        return (
          <div key={le.exerciseId} className="rounded-lg border overflow-hidden">
            <button
              type="button"
              onClick={() =>
                setCollapsed((prev) => ({
                  ...prev,
                  [le.exerciseId]: !prev[le.exerciseId],
                }))
              }
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted",
                exDone && "bg-green-50 dark:bg-green-950/30"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {ex?.name ?? "Bilinmeyen"}
                </span>
                <Badge variant="outline" className="text-xs">
                  {MUSCLE_LABELS[le.sets[0] ? ex?.muscleGroup ?? "" : ""] ??
                    ex?.muscleGroup ?? ""}
                </Badge>
                {exDone && (
                  <Badge className="text-xs bg-green-500">Tamamlandı</Badge>
                )}
              </div>
              {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>

            {!isCollapsed && (
              <div className="flex flex-col gap-1 p-3">
                <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 px-2 mb-1">
                  <span className="text-xs text-muted-foreground w-8 text-center">Set</span>
                  <span className="text-xs text-muted-foreground">Tekrar</span>
                  <span className="text-xs text-muted-foreground">Ağırlık</span>
                  <span className="text-xs text-muted-foreground w-8 text-center">✓</span>
                </div>
                {le.sets.map((set, i) => (
                  <SetRow
                    key={i}
                    set={set}
                    onChange={(updated) => updateSet(le.exerciseId, i, updated)}
                  />
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-1 self-start"
                  onClick={() => addSet(le.exerciseId)}
                >
                  <Plus size={14} className="mr-1" />
                  Set Ekle
                </Button>
              </div>
            )}
          </div>
        );
      })}

      {logExercises.length > 0 && (
        <Button onClick={handleSave} disabled={saving} className="self-end">
          <Save size={15} className="mr-1.5" />
          {saving ? "Kaydediliyor…" : "Kaydet"}
        </Button>
      )}
    </div>
  );
}
