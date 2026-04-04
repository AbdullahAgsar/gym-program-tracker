"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { LogSet } from "@/lib/types";

interface Props {
  set: LogSet;
  onChange: (updated: LogSet) => void;
}

export function SetRow({ set, onChange }: Props) {
  function toggle() {
    onChange({ ...set, done: !set.done });
  }

  return (
    <div
      className={cn(
        "grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center p-2 rounded-md transition-colors",
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
        onChange={(e) =>
          onChange({
            ...set,
            reps: e.target.value === "" ? undefined : Number(e.target.value),
          })
        }
        className="h-8 text-sm"
      />
      <Input
        type="number"
        min={0}
        step={0.5}
        placeholder="kg"
        value={set.weight ?? ""}
        onChange={(e) =>
          onChange({
            ...set,
            weight:
              e.target.value === "" ? undefined : Number(e.target.value),
          })
        }
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
    </div>
  );
}
