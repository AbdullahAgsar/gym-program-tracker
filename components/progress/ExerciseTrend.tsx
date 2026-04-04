"use client";

import { cn } from "@/lib/utils";
import type { ProgressResult } from "@/lib/progress";

interface Props {
  result: ProgressResult;
  exerciseName: string;
}

export function ExerciseTrend({ result, exerciseName }: Props) {
  const { delta, currentMax, message } = result;

  const color =
    delta === null
      ? "text-muted-foreground"
      : delta > 0
      ? "text-green-600 dark:text-green-400"
      : delta < 0
      ? "text-red-500 dark:text-red-400"
      : "text-yellow-600 dark:text-yellow-400";

  return (
    <div className="rounded-lg border bg-card p-4 flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-sm">{exerciseName}</span>
        {currentMax !== null && (
          <span className="text-sm font-semibold tabular-nums">
            {currentMax} kg
          </span>
        )}
      </div>
      <p className={cn("text-xs", color)}>{message}</p>
    </div>
  );
}
