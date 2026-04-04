"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ChevronLeft, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { MUSCLE_GROUPS } from "@/lib/constants";
import type { Exercise, ProgramExercise } from "@/lib/types";
import type { MuscleGroup } from "@/lib/constants";

const MUSCLE_LABELS: Record<string, string> = {
  legs: "Bacak", forearm: "Ön Kol", upperArm: "Üst Kol",
  shoulder: "Omuz", wrist: "Bilek", chest: "Göğüs", abs: "Karın", back: "Sırt",
};

const MUSCLE_ICONS: Record<string, string> = {
  legs: "🦵", forearm: "💪", upperArm: "💪", shoulder: "🏋️",
  wrist: "🤝", chest: "🫀", abs: "⚡", back: "🔙",
};

interface Props {
  value: ProgramExercise[];
  onChange: (exercises: ProgramExercise[]) => void;
}

// Modül düzeyinde cache — dialog kapanıp açılsa bile yeniden istek atmaz
let _cache: Exercise[] | null = null;

export function ExerciseSelector({ value, onChange }: Props) {
  const [available, setAvailable] = useState<Exercise[]>(_cache ?? []);
  const [selectedGroup, setSelectedGroup] = useState<MuscleGroup | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (_cache) return; // zaten yüklendi
    fetch("/api/exercises?all=true")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          _cache = data;
          setAvailable(data);
        }
      });
  }, []);

  const selectedIds = new Set(value.map((e) => e.exerciseId));

  // Gruplar — her birinde kaç egzersiz var
  const countByGroup = MUSCLE_GROUPS.reduce<Record<string, number>>((acc, g) => {
    acc[g] = available.filter((ex) => ex.muscleGroup === g && !selectedIds.has(ex.id)).length;
    return acc;
  }, {});

  // Seçili grupta arama + puana göre sıralama
  const filteredInGroup = selectedGroup
    ? available
        .filter(
          (ex) =>
            ex.muscleGroup === selectedGroup &&
            !selectedIds.has(ex.id) &&
            ex.name.toLowerCase().includes(search.toLowerCase())
        )
        .map((ex) => {
          const ratings = ex.ratings ?? [];
          const avg = ratings.length > 0
            ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length
            : 0;
          return { ex, avg, count: ratings.length };
        })
        .sort((a, b) => b.avg - a.avg)
    : [];

  function addExercise(ex: Exercise) {
    onChange([
      ...value,
      {
        exerciseId: ex.id,
        muscleGroup: ex.muscleGroup,
        targetSets: 3,
        targetReps: 10,
        targetWeight: 0,
      },
    ]);
  }

  function removeExercise(exerciseId: string) {
    onChange(value.filter((e) => e.exerciseId !== exerciseId));
  }

  function updateEntry(
    exerciseId: string,
    field: "targetSets" | "targetReps" | "targetWeight",
    val: number
  ) {
    onChange(value.map((e) => (e.exerciseId === exerciseId ? { ...e, [field]: val } : e)));
  }

  function getExerciseName(exerciseId: string) {
    return available.find((ex) => ex.id === exerciseId)?.name ?? exerciseId;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Seçili egzersizler */}
      {value.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label>Seçili ({value.length})</Label>
          <div className="flex flex-col gap-2">
            {value.map((entry) => (
              <div key={entry.exerciseId} className="rounded-md border p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{getExerciseName(entry.exerciseId)}</span>
                    <Badge variant="outline" className="text-xs">
                      {MUSCLE_LABELS[entry.muscleGroup] ?? entry.muscleGroup}
                    </Badge>
                  </div>
                  <Button type="button" size="icon" variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => removeExercise(entry.exerciseId)}>
                    <Trash2 size={13} />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(["targetSets", "targetReps", "targetWeight"] as const).map((field) => (
                    <div key={field} className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">
                        {field === "targetSets" ? "Set" : field === "targetReps" ? "Tekrar" : "Ağırlık (kg)"}
                      </Label>
                      <Input type="number" min={field === "targetWeight" ? 0 : 1}
                        value={entry[field]}
                        onChange={(e) => updateEntry(entry.exerciseId, field, Number(e.target.value))}
                        className="h-8 text-sm" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Egzersiz ekle */}
      <div className="flex flex-col gap-2">
        <Label>Egzersiz Ekle</Label>

        {!selectedGroup ? (
          /* Kategori seçimi */
          <div className="grid grid-cols-2 gap-2">
            {MUSCLE_GROUPS.map((group) => (
              <button
                key={group}
                type="button"
                onClick={() => { setSelectedGroup(group); setSearch(""); }}
                disabled={countByGroup[group] === 0}
                className={cn(
                  "flex items-center gap-2 rounded-lg border p-3 text-left transition-colors",
                  countByGroup[group] > 0
                    ? "hover:bg-muted cursor-pointer"
                    : "opacity-40 cursor-not-allowed"
                )}
              >
                <span className="text-lg">{MUSCLE_ICONS[group]}</span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{MUSCLE_LABELS[group]}</span>
                  <span className="text-xs text-muted-foreground">
                    {countByGroup[group]} egzersiz
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* Grup içi liste */
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0"
                onClick={() => { setSelectedGroup(null); setSearch(""); }}>
                <ChevronLeft size={16} />
              </Button>
              <span className="text-sm font-medium">
                {MUSCLE_ICONS[selectedGroup]} {MUSCLE_LABELS[selectedGroup]}
              </span>
            </div>

            <Input
              placeholder="Egzersiz ara…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />

            <div className="rounded-md border max-h-72 overflow-y-auto flex flex-col divide-y">
              {filteredInGroup.length === 0 ? (
                <p className="text-sm text-muted-foreground p-3">Sonuç bulunamadı.</p>
              ) : (
                filteredInGroup.map(({ ex, avg, count }) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => addExercise(ex)}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-muted text-left transition-colors"
                  >
                    {/* Thumbnail */}
                    {ex.images?.[0] ? (
                      <img
                        src={ex.images[0]}
                        alt={ex.name}
                        loading="lazy"
                        className="w-10 h-10 rounded object-cover shrink-0 bg-muted"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-muted shrink-0" />
                    )}

                    {/* Name + rating */}
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm truncate">{ex.name}</span>
                      {count > 0 && (
                        <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                          <Star size={10} className="fill-yellow-400 text-yellow-400" />
                          {avg.toFixed(1)}
                          <span className="ml-0.5">({count})</span>
                        </span>
                      )}
                    </div>

                    <Plus size={15} className="text-muted-foreground shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
