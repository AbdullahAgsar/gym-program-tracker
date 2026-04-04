"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Exercise } from "@/lib/types";

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

const STATUS_LABELS: Record<string, string> = {
  approved: "Onaylı",
  pending: "Beklemede",
  rejected: "Reddedildi",
};

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  approved: "default",
  pending: "secondary",
  rejected: "destructive",
};

interface Props {
  exercise: Exercise;
  currentUserId: string;
  isAdmin: boolean;
  onEdit: (exercise: Exercise) => void;
  onDelete: (id: string) => void;
  // seçim modu
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

export function ExerciseCard({
  exercise,
  currentUserId,
  isAdmin,
  onEdit,
  onDelete,
  selectable = false,
  selected = false,
  onSelect,
}: Props) {
  const canEdit = exercise.createdBy === currentUserId || isAdmin;

  function handleCardClick() {
    if (selectable && onSelect) onSelect(exercise.id);
  }

  return (
    <div
      onClick={selectable ? handleCardClick : undefined}
      className={cn(
        "rounded-lg border bg-card p-4 flex flex-col gap-3 relative transition-all",
        selectable && "cursor-pointer select-none",
        selected && "ring-2 ring-primary border-primary bg-primary/5"
      )}
    >
      {/* Seçim checkbox */}
      {selectable && (
        <div
          className={cn(
            "absolute top-3 right-3 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors",
            selected
              ? "bg-primary border-primary text-primary-foreground"
              : "border-border bg-background"
          )}
        >
          {selected && <Check size={12} strokeWidth={3} />}
        </div>
      )}

      {exercise.mediaUrl && (
        <div className="rounded-md overflow-hidden bg-muted aspect-video">
          {exercise.mediaType === "video" ? (
            <video
              src={exercise.mediaUrl}
              controls
              className="w-full h-full object-cover"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={exercise.mediaUrl}
              alt={exercise.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold leading-tight pr-6">{exercise.name}</h3>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline">
              {MUSCLE_LABELS[exercise.muscleGroup] ?? exercise.muscleGroup}
            </Badge>
            {exercise.scope === "global" && (
              <Badge variant={STATUS_VARIANTS[exercise.status] ?? "outline"}>
                {STATUS_LABELS[exercise.status] ?? exercise.status}
              </Badge>
            )}
            {exercise.scope === "personal" && (
              <Badge variant="outline">Kişisel</Badge>
            )}
          </div>
        </div>
        {canEdit && !selectable && (
          <div className="flex gap-1 shrink-0">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => onEdit(exercise)}
            >
              <Pencil size={14} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(exercise.id)}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
