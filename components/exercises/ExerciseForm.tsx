"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MediaUpload } from "@/components/shared/MediaUpload";
import { MUSCLE_GROUPS } from "@/lib/constants";
import type { Exercise } from "@/lib/types";
import type { ExerciseStatus } from "@/lib/constants";

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
  initial?: Exercise;
  isAdmin?: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ExerciseForm({ initial, isAdmin = false, onSuccess, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [muscleGroup, setMuscleGroup] = useState(initial?.muscleGroup ?? "");
  const [scope, setScope] = useState<"global" | "personal">(
    initial?.scope ?? "global"
  );
  const [status, setStatus] = useState<ExerciseStatus>(
    initial?.status ?? "pending"
  );
  const [level, setLevel] = useState<string>(initial?.level ?? "");
  const [equipment, setEquipment] = useState(initial?.equipment ?? "");
  const [mediaUrl, setMediaUrl] = useState(initial?.mediaUrl ?? "");
  const [mediaType, setMediaType] = useState(initial?.mediaType ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!muscleGroup) {
      toast.error("Kas grubu seçiniz.");
      return;
    }

    setLoading(true);

    const body: Record<string, unknown> = {
      name,
      muscleGroup,
      scope,
      level: level || undefined,
      equipment: equipment || undefined,
      mediaUrl: mediaUrl || undefined,
      mediaType: mediaType || undefined,
    };

    // Admin düzenleme sırasında status gönder
    if (isAdmin && initial) {
      body.status = status;
    }

    const url = initial ? `/api/exercises/${initial.id}` : "/api/exercises";
    const method = initial ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Bir hata oluştu.");
        return;
      }
      toast.success(initial ? "Egzersiz güncellendi." : "Egzersiz eklendi.");
      onSuccess();
    } catch {
      toast.error("Sunucuya bağlanılamadı.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ex-name">Egzersiz Adı</Label>
        <Input
          id="ex-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Kas Grubu</Label>
        <Select value={muscleGroup} onValueChange={setMuscleGroup}>
          <SelectTrigger>
            <SelectValue placeholder="Seçiniz…" />
          </SelectTrigger>
          <SelectContent>
            {MUSCLE_GROUPS.map((g) => (
              <SelectItem key={g} value={g}>
                {MUSCLE_LABELS[g] ?? g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Kapsam</Label>
        <Select
          value={scope}
          onValueChange={(v) => setScope(v as "global" | "personal")}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="global">Global (admin onayı gerekir)</SelectItem>
            <SelectItem value="personal">Kişisel</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Seviye</Label>
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger>
              <SelectValue placeholder="Seçiniz…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Başlangıç</SelectItem>
              <SelectItem value="intermediate">Orta</SelectItem>
              <SelectItem value="expert">İleri</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Ekipman</Label>
          <Input
            placeholder="Dumbbell, barbell…"
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
          />
        </div>
      </div>

      {isAdmin && initial && initial.scope === "global" && (
        <div className="flex flex-col gap-1.5">
          <Label>Onay Durumu</Label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as ExerciseStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="approved">Onaylı</SelectItem>
              <SelectItem value="pending">Beklemede</SelectItem>
              <SelectItem value="rejected">Reddedildi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label>Medya (isteğe bağlı)</Label>
        <MediaUpload
          mediaUrl={mediaUrl}
          mediaType={mediaType}
          onUpload={(url, type) => {
            setMediaUrl(url);
            setMediaType(type);
          }}
          onRemove={() => {
            setMediaUrl("");
            setMediaType("");
          }}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          İptal
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Kaydediliyor…" : initial ? "Güncelle" : "Ekle"}
        </Button>
      </div>
    </form>
  );
}
