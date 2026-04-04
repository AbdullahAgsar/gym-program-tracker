"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RecentProgressEvent } from "@/app/api/progress/recent/route";

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null)
    return <span className="text-xs text-muted-foreground">İlk seans</span>;
  if (delta > 0)
    return (
      <span className="flex items-center gap-0.5 text-xs text-green-600 dark:text-green-400 font-medium">
        <TrendingUp size={12} />+{delta} kg
      </span>
    );
  if (delta < 0)
    return (
      <span className="flex items-center gap-0.5 text-xs text-red-500 dark:text-red-400 font-medium">
        <TrendingDown size={12} />{delta} kg
      </span>
    );
  return (
    <span className="flex items-center gap-0.5 text-xs text-yellow-600 dark:text-yellow-400 font-medium">
      <Minus size={12} />Aynı
    </span>
  );
}

export function RecentProgress() {
  const [events, setEvents] = useState<RecentProgressEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/progress/recent")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setEvents(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (events.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Son Gelişimler
        </h2>
        <Link
          href="/progress"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Tümü <ArrowRight size={12} />
        </Link>
      </div>

      <div className="flex flex-col divide-y rounded-lg border overflow-hidden">
        {events.map((ev, i) => {
          const date = new Date(ev.date + "T00:00:00").toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "short",
            weekday: "short",
          });

          return (
            <Link
              key={i}
              href={`/calendar/${ev.date}`}
              className="flex items-center justify-between gap-3 px-4 py-3 bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-medium truncate">{ev.exerciseName}</span>
                <span className="text-xs text-muted-foreground">{date}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <DeltaBadge delta={ev.delta} />
                <span className="text-sm font-semibold tabular-nums">{ev.maxWeight} kg</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
