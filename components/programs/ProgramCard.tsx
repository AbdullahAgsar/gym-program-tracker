"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { Program, Exercise } from "@/lib/types";

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
  program: Program;
  exercises: Exercise[];
  onEdit: (program: Program) => void;
  onDelete: (id: string) => void;
}

export function ProgramCard({ program, exercises, onEdit, onDelete }: Props) {
  const exerciseMap = new Map(exercises.map((ex) => [ex.id, ex]));

  // Benzersiz kas gruplarını topla
  const muscleGroups = [
    ...new Set(program.exercises.map((e) => e.muscleGroup)),
  ];

  const createdAt = new Date(program.createdAt).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="rounded-lg border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold">{program.name}</h3>
          <p className="text-xs text-muted-foreground">{createdAt}</p>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => onEdit(program)}
          >
            <Pencil size={14} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(program.id)}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {/* Kas grupları */}
      <div className="flex flex-wrap gap-1.5">
        {muscleGroups.map((mg) => (
          <Badge key={mg} variant="secondary" className="text-xs">
            {MUSCLE_LABELS[mg] ?? mg}
          </Badge>
        ))}
      </div>

      {/* Egzersiz listesi */}
      <ul className="flex flex-col gap-1">
        {program.exercises.map((entry) => {
          const ex = exerciseMap.get(entry.exerciseId);
          return (
            <li
              key={entry.exerciseId}
              className="text-sm text-muted-foreground flex items-center justify-between"
            >
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
