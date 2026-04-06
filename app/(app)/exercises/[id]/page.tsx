"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, Dumbbell, Zap, Package, Globe, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExerciseCrossfade } from "@/components/exercises/ExerciseCard";
import type { Exercise } from "@/lib/types";

const MUSCLE_LABELS: Record<string, string> = {
  legs: "Bacak", forearm: "Ön Kol", upperArm: "Üst Kol",
  shoulder: "Omuz", wrist: "Bilek", chest: "Göğüs", abs: "Karın", back: "Sırt",
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Başlangıç", intermediate: "Orta", expert: "İleri",
};

const LEVEL_COLORS: Record<string, string> = {
  beginner: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  intermediate: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  expert: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
};

const STATUS_LABELS: Record<string, string> = {
  approved: "Onaylı", pending: "Onay Bekliyor", rejected: "Reddedildi",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  approved: "default", pending: "secondary", rejected: "destructive",
};

interface Me {
  id: string;
  username: string;
  role: "admin" | "user";
}

export default function ExerciseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Rating state
  const [hover, setHover] = useState<number | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [localAvg, setLocalAvg] = useState(0);
  const [localCount, setLocalCount] = useState(0);
  const [localUserRating, setLocalUserRating] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => { if (r.ok) r.json().then(setMe); });
  }, []);

  useEffect(() => {
    fetch(`/api/exercises/${id}`)
      .then(async (r) => {
        if (!r.ok) { setNotFound(true); return; }
        const data: Exercise = await r.json();
        setExercise(data);
        const ratings = data.ratings ?? [];
        const avg = ratings.length > 0
          ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length
          : 0;
        setLocalAvg(Math.round(avg * 10) / 10);
        setLocalCount(ratings.length);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (exercise && me) {
      const userRating = exercise.ratings?.find((r) => r.userId === me.id)?.rating ?? null;
      setLocalUserRating(userRating);
    }
  }, [exercise, me]);

  async function handleRate(star: number) {
    if (ratingLoading) return;
    setRatingLoading(true);
    const removing = localUserRating === star;
    try {
      const res = await fetch(`/api/exercises/${id}/rate`, {
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

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
        </div>
      </main>
    );
  }

  if (notFound || !exercise) {
    return (
      <main className="max-w-2xl mx-auto p-6 flex flex-col gap-4">
        <Button variant="ghost" size="sm" className="self-start -ml-2" onClick={() => router.back()}>
          <ArrowLeft size={16} className="mr-1" /> Geri
        </Button>
        <p className="text-muted-foreground">Egzersiz bulunamadı.</p>
      </main>
    );
  }

  const hasImages = (exercise.images?.length ?? 0) > 0;
  const hasMedia = !hasImages && !!exercise.mediaUrl;
  const hasPrimary = (exercise.primaryMuscles?.length ?? 0) > 0;
  const hasSecondary = (exercise.secondaryMuscles?.length ?? 0) > 0;
  const hasInstructions = (exercise.instructions?.length ?? 0) > 0;
  const displayStar = hover ?? localUserRating ?? 0;

  return (
    <main className="max-w-2xl mx-auto p-6 flex flex-col gap-6 pb-16">
      {/* Back */}
      <Button variant="ghost" size="sm" className="self-start -ml-2" onClick={() => router.back()}>
        <ArrowLeft size={16} className="mr-1" /> Egzersizler
      </Button>

      {/* Media */}
      {hasImages && (
        <ExerciseCrossfade images={exercise.images!} name={exercise.name} />
      )}
      {hasMedia && (
        <div className="rounded-xl overflow-hidden bg-muted aspect-video">
          {exercise.mediaType === "video" ? (
            <video src={exercise.mediaUrl} controls className="w-full h-full object-cover" />
          ) : (
            <img src={exercise.mediaUrl} alt={exercise.name} className="w-full h-full object-cover" />
          )}
        </div>
      )}

      {/* Title + status */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold leading-tight">{exercise.name}</h1>
        <div className="flex flex-wrap gap-2">
          {exercise.scope === "global" && (
            <Badge variant={STATUS_VARIANTS[exercise.status] ?? "outline"}>
              {STATUS_LABELS[exercise.status] ?? exercise.status}
            </Badge>
          )}
          {exercise.scope === "personal" && (
            <Badge variant="outline" className="gap-1">
              <Lock size={11} /> Kişisel
            </Badge>
          )}
          {exercise.scope === "global" && (
            <Badge variant="outline" className="gap-1">
              <Globe size={11} /> Genel
            </Badge>
          )}
        </div>
      </div>

      {/* Metadata grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <MetaCard
          icon={<Dumbbell size={15} />}
          label="Kas Grubu"
          value={MUSCLE_LABELS[exercise.muscleGroup] ?? exercise.muscleGroup}
        />
        {exercise.level && (
          <MetaCard
            icon={<Zap size={15} />}
            label="Seviye"
            value={LEVEL_LABELS[exercise.level] ?? exercise.level}
            valueClass={LEVEL_COLORS[exercise.level]}
          />
        )}
        {exercise.equipment && exercise.equipment !== "body only" && (
          <MetaCard
            icon={<Package size={15} />}
            label="Ekipman"
            value={exercise.equipment}
            capitalize
          />
        )}
        {exercise.equipment === "body only" && (
          <MetaCard
            icon={<Package size={15} />}
            label="Ekipman"
            value="Ekipsiz"
          />
        )}
      </div>

      {/* Primary muscles */}
      {hasPrimary && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Ana Kaslar
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {exercise.primaryMuscles!.map((m) => (
              <Badge key={m} variant="secondary" className="capitalize">{m}</Badge>
            ))}
          </div>
        </section>
      )}

      {/* Secondary muscles */}
      {hasSecondary && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Yardımcı Kaslar
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {exercise.secondaryMuscles!.map((m) => (
              <Badge key={m} variant="outline" className="capitalize">{m}</Badge>
            ))}
          </div>
        </section>
      )}

      {/* Instructions */}
      {hasInstructions && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Nasıl Yapılır?
          </h2>
          <ol className="flex flex-col gap-3">
            {exercise.instructions!.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed pt-0.5">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Rating */}
      <section className="flex flex-col gap-3 border-t pt-5">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Puanlama
        </h2>
        <div className="flex items-center gap-4">
          <div
            className="flex items-center gap-1"
            onMouseLeave={() => setHover(null)}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleRate(star)}
                onMouseEnter={() => setHover(star)}
                disabled={ratingLoading}
                className="hover:scale-110 transition-transform"
              >
                <Star
                  size={22}
                  className={cn(
                    "transition-colors",
                    star <= displayStar
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-transparent text-muted-foreground"
                  )}
                />
              </button>
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            {localCount > 0 ? (
              <>
                <span className="font-semibold text-foreground text-base">{localAvg.toFixed(1)}</span>
                <span className="ml-1">({localCount} oy)</span>
              </>
            ) : (
              "Henüz puan verilmedi"
            )}
          </span>
        </div>
      </section>
    </main>
  );
}

function MetaCard({
  icon, label, value, valueClass, capitalize,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
  capitalize?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-card p-3 flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <span className={cn(
        "text-sm font-medium",
        capitalize && "capitalize",
        valueClass
      )}>
        {value}
      </span>
    </div>
  );
}
