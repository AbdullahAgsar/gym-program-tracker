"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil, Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Exercise } from "@/lib/types";

const MUSCLE_LABELS: Record<string, string> = {
  legs: "Bacak", forearm: "Ön Kol", upperArm: "Üst Kol",
  shoulder: "Omuz", wrist: "Bilek", chest: "Göğüs", abs: "Karın", back: "Sırt",
};

const STATUS_LABELS: Record<string, string> = {
  approved: "Onaylı", pending: "Beklemede", rejected: "Reddedildi",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  approved: "default", pending: "secondary", rejected: "destructive",
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Başlangıç", intermediate: "Orta", expert: "İleri",
};

const LEVEL_OVERLAY: Record<string, string> = {
  beginner: "bg-emerald-500/85 text-white",
  intermediate: "bg-amber-500/85 text-white",
  expert: "bg-rose-500/85 text-white",
};

interface Props {
  exercise: Exercise;
  currentUserId: string;
  isAdmin: boolean;
  onEdit: (exercise: Exercise) => void;
  onDelete: (id: string) => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

/** Two-frame crossfade animation for imported exercises — alternates every 1s */
export function ExerciseCrossfade({ images, name }: { images: string[]; name: string }) {
  const [frame, setFrame] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded || images.length < 2) return;
    const id = setInterval(() => setFrame((f) => (f === 0 ? 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [loaded, images.length]);

  if (images.length === 0) return null;

  return (
    <div className="rounded-md overflow-hidden bg-muted aspect-video relative">
      <img
        src={images[0]}
        alt={`${name} — start`}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={cn(
          "absolute inset-0 w-full h-full object-contain transition-none",
          frame === 0 ? "opacity-100" : "opacity-0"
        )}
      />
      {images.length > 1 && (
        <img
          src={images[1]}
          alt={`${name} — end`}
          loading="lazy"
          className={cn(
            "absolute inset-0 w-full h-full object-contain transition-none",
            frame === 1 ? "opacity-100" : "opacity-0"
          )}
        />
      )}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
        </div>
      )}
    </div>
  );
}

export function ExerciseCard({
  exercise, currentUserId, isAdmin, onEdit, onDelete,
  selectable = false, selected = false, onSelect,
}: Props) {
  const canEdit = exercise.createdBy === currentUserId || isAdmin;

  const ratings = exercise.ratings ?? [];
  const avg = ratings.length > 0 ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : 0;
  const userRating = ratings.find((r) => r.userId === currentUserId)?.rating ?? null;

  const [localAvg, setLocalAvg] = useState(Math.round(avg * 10) / 10);
  const [localCount, setLocalCount] = useState(ratings.length);
  const [localUserRating, setLocalUserRating] = useState<number | null>(userRating);
  const [hover, setHover] = useState<number | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);

  async function handleRate(star: number) {
    if (ratingLoading) return;
    setRatingLoading(true);
    const removing = localUserRating === star;
    try {
      const res = await fetch(`/api/exercises/${exercise.id}/rate`, {
        method: removing ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: removing ? undefined : JSON.stringify({ rating: star }),
      });
      if (res.ok) {
        const data = await res.json();
        setLocalAvg(data.average);
        setLocalCount(data.count);
        setLocalUserRating(data.userRating);
      }
    } finally {
      setRatingLoading(false);
    }
  }

  const displayStar = hover ?? localUserRating ?? 0;
  const hasImages = (exercise.images?.length ?? 0) > 0;
  const hasMedia = !hasImages && !!exercise.mediaUrl;
  const hasSecondary = (exercise.secondaryMuscles?.length ?? 0) > 0;

  const overlayBadges = (
    <div className="absolute top-2 left-2 flex flex-wrap gap-1 pointer-events-none z-10">
      <span className="inline-flex items-center rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
        {MUSCLE_LABELS[exercise.muscleGroup] ?? exercise.muscleGroup}
      </span>
      {exercise.level && (
        <span className={cn(
          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
          LEVEL_OVERLAY[exercise.level] ?? "bg-black/60 text-white"
        )}>
          {LEVEL_LABELS[exercise.level] ?? exercise.level}
        </span>
      )}
    </div>
  );

  return (
    <div
      onClick={selectable ? () => onSelect?.(exercise.id) : undefined}
      className={cn(
        "rounded-lg border bg-card p-4 flex flex-col gap-3 relative transition-all",
        selectable && "cursor-pointer select-none",
        selected && "ring-2 ring-primary border-primary bg-primary/5"
      )}
    >
      {selectable && (
        <div className={cn(
          "absolute top-3 right-3 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors",
          selected ? "bg-primary border-primary text-primary-foreground" : "border-border bg-background"
        )}>
          {selected && <Check size={12} strokeWidth={3} />}
        </div>
      )}

      {/* Images with overlay badges */}
      {hasImages && (
        <div className="relative">
          <ExerciseCrossfade images={exercise.images!} name={exercise.name} />
          {overlayBadges}
        </div>
      )}

      {/* User-uploaded media with overlay badges */}
      {hasMedia && (
        <div className="relative rounded-md overflow-hidden bg-muted aspect-video">
          {exercise.mediaType === "video" ? (
            <video src={exercise.mediaUrl} controls className="w-full h-full object-cover"
              onClick={(e) => e.stopPropagation()} />
          ) : (
            <img src={exercise.mediaUrl} alt={exercise.name} loading="lazy"
              className="w-full h-full object-cover" />
          )}
          {overlayBadges}
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1.5">
          {selectable ? (
            <h3 className="font-semibold leading-tight pr-6">{exercise.name}</h3>
          ) : (
            <Link href={`/exercises/${exercise.id}`}
              className="font-semibold leading-tight pr-6 hover:underline underline-offset-2"
              onClick={(e) => e.stopPropagation()}>
              {exercise.name}
            </Link>
          )}

          {/* Level + muscleGroup shown in header only when there's no media */}
          {!hasImages && !hasMedia && (
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline">
                {MUSCLE_LABELS[exercise.muscleGroup] ?? exercise.muscleGroup}
              </Badge>
              {exercise.level && (
                <Badge variant="outline">
                  {LEVEL_LABELS[exercise.level] ?? exercise.level}
                </Badge>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {exercise.scope === "global" && (
              <Badge variant={STATUS_VARIANTS[exercise.status] ?? "outline"}>
                {STATUS_LABELS[exercise.status] ?? exercise.status}
              </Badge>
            )}
            {exercise.scope === "personal" && <Badge variant="outline">Kişisel</Badge>}
          </div>

          {exercise.equipment && exercise.equipment !== "body only" && (
            <p className="text-xs text-muted-foreground capitalize">{exercise.equipment}</p>
          )}
        </div>

        {canEdit && !selectable && (
          <div className="flex gap-1 shrink-0">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(exercise)}>
              <Pencil size={14} />
            </Button>
            <Button size="icon" variant="ghost"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(exercise.id)}>
              <Trash2 size={14} />
            </Button>
          </div>
        )}
      </div>

      {/* Secondary muscles */}
      {hasSecondary && !selectable && (
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-xs text-muted-foreground shrink-0">Yardımcı kaslar:</span>
          {exercise.secondaryMuscles!.map((m) => (
            <Badge key={m} variant="outline" className="text-xs capitalize py-0">{m}</Badge>
          ))}
        </div>
      )}

      {/* Star rating */}
      {!selectable && (
        <div className="flex items-center gap-2 pt-1 border-t"
          onMouseLeave={() => setHover(null)}>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} type="button"
                onClick={(e) => { e.stopPropagation(); handleRate(star); }}
                onMouseEnter={() => setHover(star)}
                disabled={ratingLoading}
                className="hover:scale-110 transition-transform"
              >
                <Star size={14} className={cn(
                  "transition-colors",
                  star <= displayStar
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-transparent text-muted-foreground"
                )} />
              </button>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {localCount > 0
              ? <><span className="font-medium text-foreground">{localAvg.toFixed(1)}</span> ({localCount})</>
              : "Henüz puan yok"}
          </span>
        </div>
      )}
    </div>
  );
}
