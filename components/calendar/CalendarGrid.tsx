"use client";

import { useMemo } from "react";
import { DayCell } from "./DayCell";
import type { Log } from "@/lib/types";

const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

interface Props {
  year: number;
  month: number; // 1-12
  logs: Log[];
}

function calcCompletionPct(log: Log): number {
  if (log.exercises.length === 0) return 0;
  const totalSets = log.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  if (totalSets === 0) return 0;
  const doneSets = log.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.done).length,
    0
  );
  return Math.round((doneSets / totalSets) * 100);
}

export function CalendarGrid({ year, month, logs }: Props) {
  const today = new Date().toISOString().slice(0, 10);

  // Log'ları date → log eşlemesi
  const logMap = useMemo(
    () => new Map(logs.map((l) => [l.date, l])),
    [logs]
  );

  const cells = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    // Pazartesi başlangıçlı: 0=Pzt … 6=Paz
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month, 0).getDate();
    const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

    const result: {
      date: string;
      isCurrentMonth: boolean;
    }[] = [];

    // Önceki ayın son günleri
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const m = month - 1 === 0 ? 12 : month - 1;
      const y = month - 1 === 0 ? year - 1 : year;
      result.push({
        date: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        isCurrentMonth: false,
      });
    }

    // Bu ayın günleri
    for (let d = 1; d <= daysInMonth; d++) {
      result.push({
        date: `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        isCurrentMonth: true,
      });
    }

    // Sonraki ayın ilk günleri (42 hücre = 6 satır)
    const remaining = 42 - result.length;
    for (let d = 1; d <= remaining; d++) {
      const m = month + 1 === 13 ? 1 : month + 1;
      const y = month + 1 === 13 ? year + 1 : year;
      result.push({
        date: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        isCurrentMonth: false,
      });
    }

    return result;
  }, [year, month]);

  return (
    <div className="flex flex-col gap-2">
      {/* Gün başlıkları */}
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-medium text-muted-foreground py-1"
          >
            {d}
          </div>
        ))}
      </div>
      {/* Hücreler */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map(({ date, isCurrentMonth }) => {
          const log = logMap.get(date);
          const completionPct = log ? calcCompletionPct(log) : null;
          return (
            <DayCell
              key={date}
              date={date}
              isCurrentMonth={isCurrentMonth}
              isToday={date === today}
              completionPct={completionPct}
            />
          );
        })}
      </div>
    </div>
  );
}
