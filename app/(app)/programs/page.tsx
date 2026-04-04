"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProgramCard } from "@/components/programs/ProgramCard";
import { ProgramForm } from "@/components/programs/ProgramForm";
import { Plus } from "lucide-react";
import type { Program, Exercise } from "@/lib/types";

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);

  const fetchPrograms = useCallback(async () => {
    const res = await fetch("/api/programs");
    if (res.ok) setPrograms(await res.json());
  }, []);

  useEffect(() => {
    fetchPrograms();
    fetch("/api/exercises")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setExercises(data));
  }, [fetchPrograms]);

  async function handleDelete(id: string) {
    if (!confirm("Bu programı silmek istediğine emin misin?")) return;
    const res = await fetch(`/api/programs/${id}`, { method: "DELETE" });
    if (res.ok) toast.success("Program silindi.");
    else toast.error("Silinemedi.");
    fetchPrograms();
  }

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(program: Program) {
    setEditing(program);
    setDialogOpen(true);
  }

  function handleSuccess() {
    setDialogOpen(false);
    fetchPrograms();
  }

  return (
    <main className="max-w-4xl mx-auto p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Programlarım</h1>
        <Button onClick={openCreate} size="sm">
          <Plus size={16} className="mr-1" />
          Yeni Program
        </Button>
      </div>

      {programs.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Henüz program oluşturmadın.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {programs.map((p) => (
            <ProgramCard
              key={p.id}
              program={p}
              exercises={exercises}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Programı Düzenle" : "Yeni Program"}
            </DialogTitle>
          </DialogHeader>
          <ProgramForm
            initial={editing ?? undefined}
            onSuccess={handleSuccess}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </main>
  );
}
