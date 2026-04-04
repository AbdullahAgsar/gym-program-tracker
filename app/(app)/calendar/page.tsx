"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Log } from "@/lib/types";

const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [logs, setLogs] = useState<Log[]>([]);

  const fetchLogs = useCallback(async () => {
    const res = await fetch("/api/logs");
    if (res.ok) setLogs(await res.json());
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  function prev() {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }

  function next() {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  return (
    <main className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Takvim</h1>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" onClick={prev}>
            <ChevronLeft size={16} />
          </Button>
          <span className="w-32 text-center font-medium text-sm">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <Button size="icon" variant="outline" onClick={next}>
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      <CalendarGrid year={year} month={month} logs={logs} />

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span>Tamamlandı (%100)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-yellow-400" />
          <span>Kısmi (%50+)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-orange-400" />
          <span>Az tamamlandı</span>
        </div>
      </div>
    </main>
  );
}
