"use client";

import { MUSCLE_GROUPS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = {
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
  value: string | null;
  onChange: (value: string | null) => void;
}

export function MuscleGroupFilter({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={value === null ? "default" : "outline"}
        size="sm"
        onClick={() => onChange(null)}
      >
        Tümü
      </Button>
      {MUSCLE_GROUPS.map((group) => (
        <Button
          key={group}
          variant={value === group ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(group)}
        >
          {LABELS[group] ?? group}
        </Button>
      ))}
    </div>
  );
}
