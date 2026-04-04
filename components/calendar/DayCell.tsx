"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

interface Props {
  date: string; // YYYY-MM-DD
  isCurrentMonth: boolean;
  isToday: boolean;
  completionPct: number | null; // null = antrenman yok
}

export function DayCell({ date, isCurrentMonth, isToday, completionPct }: Props) {
  const day = new Date(date + "T00:00:00").getDate();
  const hasWorkout = completionPct !== null;

  function getBgColor() {
    if (!hasWorkout) return "";
    if (completionPct === 100) return "bg-green-500 text-white";
    if (completionPct! >= 50) return "bg-yellow-400 text-black";
    return "bg-orange-400 text-white";
  }

  return (
    <Link
      href={`/calendar/${date}`}
      className={cn(
        "aspect-square flex flex-col items-center justify-center rounded-lg text-sm font-medium transition-colors hover:bg-muted",
        !isCurrentMonth && "text-muted-foreground opacity-40",
        isToday && !hasWorkout && "ring-2 ring-primary",
        hasWorkout && getBgColor()
      )}
    >
      <span>{day}</span>
      {hasWorkout && completionPct! < 100 && (
        <span className="text-[10px] leading-none opacity-90">
          %{completionPct}
        </span>
      )}
    </Link>
  );
}
