"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ProgramCard } from "@/components/programs/ProgramCard";
import { PublicProgramCard } from "@/components/programs/PublicProgramCard";
import { ProgramForm } from "@/components/programs/ProgramForm";
import { Plus, Globe, ChevronLeft, ChevronRight } from "lucide-react";
import type { Program, Exercise } from "@/lib/types";
import type { PublicProgram } from "@/app/api/programs/public/route";

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [publicPrograms, setPublicPrograms] = useState<PublicProgram[]>([]);
  const [publicTotal, setPublicTotal] = useState(0);
  const [publicPage, setPublicPage] = useState(0);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);

  const LIMIT = 15;

  const fetchPrograms = useCallback(async () => {
    const res = await fetch("/api/programs");
    if (res.ok) setPrograms(await res.json());
  }, []);

  const fetchPublicPrograms = useCallback(async (page = 0) => {
    const res = await fetch(`/api/programs/public?page=${page}`);
    if (!res.ok) return;
    const { data, total } = await res.json();
    setPublicPrograms(data);
    setPublicTotal(total);
  }, []);

  useEffect(() => {
    fetchPrograms();
    fetchPublicPrograms(0);
  }, [fetchPrograms, fetchPublicPrograms]);

  async function loadExercisesIfNeeded() {
    if (exercises.length > 0) return;
    const r = await fetch("/api/exercises?all=true");
    const data = await r.json();
    if (Array.isArray(data)) setExercises(data);
  }

  function goPublicPage(page: number) {
    setPublicPage(page);
    fetchPublicPrograms(page);
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu programı silmek istediğine emin misin?")) return;
    const res = await fetch(`/api/programs/${id}`, { method: "DELETE" });
    if (res.ok) toast.success("Program silindi.");
    else toast.error("Silinemedi.");
    fetchPrograms();
  }

  async function openCreate() { await loadExercisesIfNeeded(); setEditing(null); setDialogOpen(true); }
  async function openEdit(program: Program) { await loadExercisesIfNeeded(); setEditing(program); setDialogOpen(true); }

  function handleSuccess() {
    setDialogOpen(false);
    fetchPrograms();
    fetchPublicPrograms(publicPage);
  }

  return (
    <main className="max-w-4xl mx-auto p-6 flex flex-col gap-8">
      {/* Kendi programlarım */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Programlarım</h1>
          <Button onClick={openCreate} size="sm">
            <Plus size={16} className="mr-1" /> Yeni Program
          </Button>
        </div>

        {programs.length === 0 ? (
          <p className="text-muted-foreground text-sm">Henüz program oluşturmadın.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {programs.map((p) => (
              <ProgramCard
                key={p.id}
                program={p}
                exercises={exercises}
                onEdit={openEdit}
                onDelete={handleDelete}
                onPublishToggle={() => fetchPublicPrograms()}
              />
            ))}
          </div>
        )}
      </section>

      {/* Topluluk programları */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-muted-foreground" />
            <h2 className="text-lg font-semibold">Topluluk Programları</h2>
            <span className="text-sm text-muted-foreground">({publicTotal})</span>
          </div>
          {publicTotal > LIMIT && (
            <div className="flex items-center gap-1">
              <Button
                size="icon" variant="outline"
                className="h-7 w-7"
                disabled={publicPage === 0}
                onClick={() => goPublicPage(publicPage - 1)}
              >
                <ChevronLeft size={14} />
              </Button>
              <span className="text-xs text-muted-foreground px-1">
                {publicPage + 1} / {Math.ceil(publicTotal / LIMIT)}
              </span>
              <Button
                size="icon" variant="outline"
                className="h-7 w-7"
                disabled={(publicPage + 1) * LIMIT >= publicTotal}
                onClick={() => goPublicPage(publicPage + 1)}
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          )}
        </div>

        {publicPrograms.length === 0 ? (
          <p className="text-muted-foreground text-sm">Henüz paylaşılan program yok.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {publicPrograms.map((p) => (
              <PublicProgramCard
                key={p.id}
                program={p}
                exercises={exercises}
                onSaved={fetchPrograms}
              />
            ))}
          </div>
        )}
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg flex flex-col h-[90vh]">
          <DialogHeader className="shrink-0">
            <DialogTitle>{editing ? "Programı Düzenle" : "Yeni Program"}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-0">
            <ProgramForm
              initial={editing ?? undefined}
              onSuccess={handleSuccess}
              onCancel={() => setDialogOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
