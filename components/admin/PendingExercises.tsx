"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import type { Exercise } from "@/lib/types";

const MUSCLE_LABELS: Record<string, string> = {
  legs: "Bacak", forearm: "Ön Kol", upperArm: "Üst Kol",
  shoulder: "Omuz", wrist: "Bilek", chest: "Göğüs", abs: "Karın", back: "Sırt",
};

export function PendingExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);

  const fetch_ = useCallback(async () => {
    const res = await fetch("/api/exercises");
    if (!res.ok) return;
    const data: Exercise[] = await res.json();
    setExercises(data.filter((ex) => ex.scope === "global" && ex.status === "pending"));
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  async function approve(id: string) {
    const res = await fetch(`/api/exercises/${id}/approve`, { method: "POST" });
    if (res.ok) toast.success("Egzersiz onaylandı.");
    else toast.error("İşlem başarısız.");
    fetch_();
  }

  async function reject(id: string) {
    const res = await fetch(`/api/exercises/${id}/reject`, { method: "POST" });
    if (res.ok) toast.success("Egzersiz reddedildi.");
    else toast.error("İşlem başarısız.");
    fetch_();
  }

  if (exercises.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Onay bekleyen egzersiz yok.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {exercises.map((ex) => (
        <div
          key={ex.id}
          className="flex items-center justify-between gap-3 rounded-lg border p-3"
        >
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-sm">{ex.name}</span>
            <Badge variant="outline" className="w-fit text-xs">
              {MUSCLE_LABELS[ex.muscleGroup] ?? ex.muscleGroup}
            </Badge>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="text-green-600 border-green-600 hover:bg-green-50"
              onClick={() => approve(ex.id)}
            >
              <Check size={14} className="mr-1" />
              Onayla
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive border-destructive hover:bg-red-50"
              onClick={() => reject(ex.id)}
            >
              <X size={14} className="mr-1" />
              Reddet
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
