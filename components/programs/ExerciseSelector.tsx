"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import type { Exercise, ProgramExercise } from "@/lib/types";

const MUSCLE_LABELS: Record<string, string> = {
  legs: "Bacak",
  forearm: "Ön Kol",
  upperArm: "Üst Kol",
  shoulder: "Omuz",
  wrist: "Bilek",
  chest: "Göğüs",
  abs: "Karın",
  back: "Sırt",
};

interface Props {
  value: ProgramExercise[];
  onChange: (exercises: ProgramExercise[]) => void;
}

export function ExerciseSelector({ value, onChange }: Props) {
  const [available, setAvailable] = useState<Exercise[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/exercises")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setAvailable(data));
  }, []);

  const selectedIds = new Set(value.map((e) => e.exerciseId));

  const filtered = available.filter(
    (ex) =>
      !selectedIds.has(ex.id) &&
      ex.name.toLowerCase().includes(search.toLowerCase())
  );

  function addExercise(ex: Exercise) {
    const entry: ProgramExercise = {
      exerciseId: ex.id,
      muscleGroup: ex.muscleGroup,
      targetSets: 3,
      targetReps: 10,
      targetWeight: 0,
    };
    onChange([...value, entry]);
  }

  function removeExercise(exerciseId: string) {
    onChange(value.filter((e) => e.exerciseId !== exerciseId));
  }

  function updateEntry(
    exerciseId: string,
    field: "targetSets" | "targetReps" | "targetWeight",
    val: number
  ) {
    onChange(
      value.map((e) =>
        e.exerciseId === exerciseId ? { ...e, [field]: val } : e
      )
    );
  }

  function getExerciseName(exerciseId: string) {
    return available.find((ex) => ex.id === exerciseId)?.name ?? exerciseId;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Seçili egzersizler */}
      {value.length > 0 && (
        <div className="flex flex-col gap-3">
          <Label>Seçili Egzersizler</Label>
          {value.map((entry) => (
            <div
              key={entry.exerciseId}
              className="rounded-md border p-3 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {getExerciseName(entry.exerciseId)}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {MUSCLE_LABELS[entry.muscleGroup] ?? entry.muscleGroup}
                  </Badge>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => removeExercise(entry.exerciseId)}
                >
                  <Trash2 size={13} />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">Set</Label>
                  <Input
                    type="number"
                    min={1}
                    value={entry.targetSets}
                    onChange={(e) =>
                      updateEntry(
                        entry.exerciseId,
                        "targetSets",
                        Number(e.target.value)
                      )
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">Tekrar</Label>
                  <Input
                    type="number"
                    min={1}
                    value={entry.targetReps}
                    onChange={(e) =>
                      updateEntry(
                        entry.exerciseId,
                        "targetReps",
                        Number(e.target.value)
                      )
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">Ağırlık (kg)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={entry.targetWeight}
                    onChange={(e) =>
                      updateEntry(
                        entry.exerciseId,
                        "targetWeight",
                        Number(e.target.value)
                      )
                    }
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Egzersiz ekleme */}
      <div className="flex flex-col gap-2">
        <Label>Egzersiz Ekle</Label>
        <Input
          placeholder="Egzersiz ara…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <div className="rounded-md border max-h-48 overflow-y-auto flex flex-col divide-y">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground p-3">
                Sonuç bulunamadı.
              </p>
            ) : (
              filtered.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => {
                    addExercise(ex);
                    setSearch("");
                  }}
                  className="flex items-center justify-between px-3 py-2 hover:bg-muted text-sm text-left"
                >
                  <span>{ex.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {MUSCLE_LABELS[ex.muscleGroup] ?? ex.muscleGroup}
                    </Badge>
                    <Plus size={14} className="text-muted-foreground" />
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
