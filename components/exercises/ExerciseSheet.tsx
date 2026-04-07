"use client";

import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Zap, Package, Globe, Lock, Star } from "lucide-react";
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

interface Props {
  exerciseId: string | null;
  onClose: () => void;
}

export function ExerciseSheet({ exerciseId, onClose }: Props) {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(false);
  const open = !!exerciseId;
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  // Geri tuşuyla kapat — sadece open değişince çalışır
  useEffect(() => {
    if (!open) return;
    history.pushState({ exerciseSheet: true }, "");
    function handlePop() { onCloseRef.current(); }
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, [open]);

  // Çarpı veya overlay tıklamasıyla kapat
  function handleOpenChange(value: boolean) {
    if (!value) {
      onClose();
      if (history.state?.exerciseSheet) history.back();
    }
  }

  useEffect(() => {
    if (!exerciseId) { setExercise(null); return; }
    setLoading(true);
    fetch(`/api/exercises/${exerciseId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setExercise(data))
      .finally(() => setLoading(false));
  }, [exerciseId]);

  const hasImages = (exercise?.images?.length ?? 0) > 0;
  const hasMedia = !hasImages && !!exercise?.mediaUrl;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="h-[90dvh] overflow-y-auto rounded-t-2xl px-6 pb-10">
        {loading ? (
          <>
            <SheetTitle className="sr-only">Yükleniyor</SheetTitle>
            <div className="flex justify-center py-20">
              <div className="w-7 h-7 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
            </div>
          </>
        ) : exercise ? (
          <div className="flex flex-col gap-6 max-w-2xl mx-auto">
            <SheetHeader className="text-left">
              <SheetTitle className="text-2xl">{exercise.name}</SheetTitle>
              <div className="flex flex-wrap gap-2 pt-1">
                {exercise.scope === "personal" && (
                  <Badge variant="outline" className="gap-1"><Lock size={11} /> Kişisel</Badge>
                )}
                {exercise.scope === "global" && (
                  <Badge variant="outline" className="gap-1"><Globe size={11} /> Genel</Badge>
                )}
              </div>
            </SheetHeader>

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
              {exercise.equipment && (
                <MetaCard
                  icon={<Package size={15} />}
                  label="Ekipman"
                  value={exercise.equipment === "body only" ? "Ekipsiz" : exercise.equipment}
                  capitalize={exercise.equipment !== "body only"}
                />
              )}
            </div>

            {(exercise.primaryMuscles?.length ?? 0) > 0 && (
              <section className="flex flex-col gap-2">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Ana Kaslar</h2>
                <div className="flex flex-wrap gap-1.5">
                  {exercise.primaryMuscles!.map((m) => (
                    <Badge key={m} variant="secondary" className="capitalize">{m}</Badge>
                  ))}
                </div>
              </section>
            )}

            {(exercise.secondaryMuscles?.length ?? 0) > 0 && (
              <section className="flex flex-col gap-2">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Yardımcı Kaslar</h2>
                <div className="flex flex-wrap gap-1.5">
                  {exercise.secondaryMuscles!.map((m) => (
                    <Badge key={m} variant="outline" className="capitalize">{m}</Badge>
                  ))}
                </div>
              </section>
            )}

            {(exercise.instructions?.length ?? 0) > 0 && (
              <section className="flex flex-col gap-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Nasıl Yapılır?</h2>
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

            {(exercise.ratings?.length ?? 0) > 0 && (
              <section className="flex flex-col gap-2 border-t pt-5">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Puanlama</h2>
                <div className="flex items-center gap-2">
                  <Star size={16} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold">
                    {(exercise.ratings.reduce((s, r) => s + r.rating, 0) / exercise.ratings.length).toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground">({exercise.ratings.length} oy)</span>
                </div>
              </section>
            )}
          </div>
        ) : (
          <>
            <SheetTitle className="sr-only">Bulunamadı</SheetTitle>
            <p className="text-muted-foreground text-sm py-10 text-center">Egzersiz bulunamadı.</p>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function MetaCard({ icon, label, value, valueClass, capitalize }: {
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
      <span className={cn("text-sm font-medium", capitalize && "capitalize", valueClass)}>
        {value}
      </span>
    </div>
  );
}
