"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Check, Minus } from "lucide-react";
import type { LogSet } from "@/lib/types";

interface Props {
  set: LogSet;
  canRemove: boolean;
  onChange: (updated: LogSet) => void;
  onRemove: () => void;
}

export function SetRow({ set, canRemove, onChange, onRemove }: Props) {
  function toggle() {
    onChange({ ...set, done: !set.done });
  }

  function handleRepsChange(val: string) {
    const reps = val === "" ? undefined : Number(val);
    // tekrar girilince ve ağırlık zaten varsa (ya da ağırlık gerekmiyorsa) otomatik tamamla
    const done = reps !== undefined && reps > 0 ? true : set.done;
    onChange({ ...set, reps, done });
  }

  function handleWeightChange(val: string) {
    const weight = val === "" ? undefined : Number(val);
    // ağırlık girilince ve tekrar da varsa otomatik tamamla
    const done =
      weight !== undefined && weight > 0 && set.reps !== undefined && set.reps > 0
        ? true
        : set.done;
    onChange({ ...set, weight, done });
  }

  return (
    <div
      className={cn(
        "grid grid-cols-[auto_1fr_1fr_auto_auto] gap-2 items-center p-2 rounded-md transition-colors",
        set.done && "bg-green-50 dark:bg-green-950/30"
      )}
    >
      <span className="text-xs text-muted-foreground w-8 text-center font-mono">
        {set.setNumber}
      </span>
      <Input
        type="number"
        min={0}
        placeholder="Tekrar"
        value={set.reps ?? ""}
        onChange={(e) => handleRepsChange(e.target.value)}
        className="h-8 text-sm"
      />
      <Input
        type="number"
        min={0}
        step={0.5}
        placeholder="kg"
        value={set.weight ?? ""}
        onChange={(e) => handleWeightChange(e.target.value)}
        className="h-8 text-sm"
      />
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "w-8 h-8 rounded-md border flex items-center justify-center transition-colors",
          set.done
            ? "bg-green-500 border-green-500 text-white"
            : "border-border hover:bg-muted"
        )}
      >
        {set.done && <Check size={14} />}
      </button>
      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        className={cn(
          "w-8 h-8 rounded-md flex items-center justify-center transition-colors",
          canRemove
            ? "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            : "text-muted-foreground/30 cursor-not-allowed"
        )}
      >
        <Minus size={14} />
      </button>
    </div>
  );
}
