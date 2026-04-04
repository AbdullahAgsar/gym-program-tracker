"use client";

import { cn } from "@/lib/utils";
import type { ProgressResult } from "@/lib/progress";

interface Props {
  result: ProgressResult;
  exerciseName: string;
}

export function ExerciseTrend({ result, exerciseName }: Props) {
  const { delta, currentMax, message, sessions } = result;

  const color =
    delta === null
      ? "text-muted-foreground"
      : delta > 0
      ? "text-green-600 dark:text-green-400"
      : delta < 0
      ? "text-red-500 dark:text-red-400"
      : "text-yellow-600 dark:text-yellow-400";

  const last5 = sessions.slice(-5).reverse();
  const maxWeight = Math.max(...last5.map((s) => s.maxWeight), 0);

  return (
    <div className="rounded-lg border bg-card p-4 flex flex-col gap-3">
      {/* Başlık */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-sm">{exerciseName}</span>
        {currentMax !== null && (
          <span className="text-sm font-semibold tabular-nums">{currentMax} kg</span>
        )}
      </div>

      {/* Delta mesajı */}
      <p className={cn("text-xs", color)}>{message}</p>

      {/* Son 5 seans */}
      {last5.length > 0 && (
        <div className="flex flex-col gap-1.5 pt-1 border-t">
          <span className="text-xs text-muted-foreground font-medium">Son {last5.length} seans</span>
          <div className="flex flex-col gap-1">
            {last5.map((session, i) => {
              const barPct = maxWeight > 0 ? (session.maxWeight / maxWeight) * 100 : 0;
              const isLatest = i === 0;
              return (
                <div key={session.date} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-20 shrink-0 tabular-nums">
                    {new Date(session.date + "T00:00:00").toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                  <div className="flex-1 h-4 bg-muted rounded-sm overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-sm transition-all",
                        isLatest ? "bg-primary" : "bg-primary/40"
                      )}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                  <span className={cn("text-xs tabular-nums w-14 text-right shrink-0", isLatest && "font-semibold")}>
                    {session.maxWeight} kg
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
