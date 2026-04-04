"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExerciseSelector } from "./ExerciseSelector";
import type { Program, ProgramExercise } from "@/lib/types";

interface Props {
  initial?: Program;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProgramForm({ initial, onSuccess, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [exercises, setExercises] = useState<ProgramExercise[]>(
    initial?.exercises ?? []
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (exercises.length === 0) {
      toast.error("En az bir egzersiz ekleyin.");
      return;
    }

    setLoading(true);

    const url = initial ? `/api/programs/${initial.id}` : "/api/programs";
    const method = initial ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, exercises }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Bir hata oluştu.");
        return;
      }
      toast.success(initial ? "Program güncellendi." : "Program oluşturuldu.");
      onSuccess();
    } catch {
      toast.error("Sunucuya bağlanılamadı.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 h-full">
      <div className="flex flex-col gap-1.5 px-1">
        <Label htmlFor="prog-name">Program Adı</Label>
        <Input
          id="prog-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="örn. Göğüs & Omuz"
          required
        />
      </div>

      <div className="flex-1 min-h-0 px-1">
        <ExerciseSelector value={exercises} onChange={setExercises} />
      </div>

      <div className="flex gap-2 justify-end shrink-0 pt-2 border-t px-1">
        <Button type="button" variant="outline" onClick={onCancel}>
          İptal
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Kaydediliyor…" : initial ? "Güncelle" : "Oluştur"}
        </Button>
      </div>
    </form>
  );
}
