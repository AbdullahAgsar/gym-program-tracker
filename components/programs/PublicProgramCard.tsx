"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookmarkPlus, Loader2 } from "lucide-react";
import type { Exercise } from "@/lib/types";
import type { PublicProgram } from "@/app/api/programs/public/route";

const MUSCLE_LABELS: Record<string, string> = {
  legs: "Bacak", forearm: "Ön Kol", upperArm: "Üst Kol",
  shoulder: "Omuz", wrist: "Bilek", chest: "Göğüs", abs: "Karın", back: "Sırt",
};

interface Props {
  program: PublicProgram;
  exercises: Exercise[];
  onSaved: () => void;
}

export function PublicProgramCard({ program, exercises, onSaved }: Props) {
  const [saving, setSaving] = useState(false);

  const exerciseMap = new Map(exercises.map((ex) => [ex.id, ex]));
  const muscleGroups = [...new Set(program.exercises.map((e) => e.muscleGroup))];

  const createdAt = new Date(program.createdAt).toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
  });

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/programs/${program.id}/save`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Kaydedilemedi."); return; }
      toast.success(`"${program.name}" programlarına eklendi.`);
      onSaved();
    } catch {
      toast.error("Sunucuya bağlanılamadı.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold">{program.name}</h3>
          <p className="text-xs text-muted-foreground">
            {program.username} · {createdAt}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={handleSave} disabled={saving} className="shrink-0">
          {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : <BookmarkPlus size={14} className="mr-1" />}
          Kaydet
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {muscleGroups.map((mg) => (
          <Badge key={mg} variant="secondary" className="text-xs">
            {MUSCLE_LABELS[mg] ?? mg}
          </Badge>
        ))}
      </div>

      <ul className="flex flex-col gap-1">
        {program.exercises.map((entry) => {
          const ex = exerciseMap.get(entry.exerciseId);
          return (
            <li key={entry.exerciseId} className="text-sm text-muted-foreground flex items-center justify-between">
              <span>{ex?.name ?? "Bilinmeyen egzersiz"}</span>
              <span className="text-xs tabular-nums">
                {entry.targetSets}×{entry.targetReps}
                {entry.targetWeight > 0 ? ` @ ${entry.targetWeight}kg` : ""}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
