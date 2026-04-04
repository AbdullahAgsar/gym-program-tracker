"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MuscleGroupFilter } from "@/components/exercises/MuscleGroupFilter";
import { ExerciseCard } from "@/components/exercises/ExerciseCard";
import { ExerciseForm } from "@/components/exercises/ExerciseForm";
import { Check, Plus, X } from "lucide-react";
import type { Exercise } from "@/lib/types";

interface Me {
  id: string;
  username: string;
  role: "admin" | "user";
}

export default function ExercisesPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [muscleGroup, setMuscleGroup] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);

  // Çoklu seçim
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [approving, setApproving] = useState(false);

  async function fetchMe() {
    const res = await fetch("/api/auth/me");
    if (res.ok) setMe(await res.json());
  }

  const fetchExercises = useCallback(async () => {
    const params = new URLSearchParams();
    if (muscleGroup) params.set("muscleGroup", muscleGroup);
    if (search) params.set("search", search);
    const res = await fetch(`/api/exercises?${params}`);
    if (res.ok) setExercises(await res.json());
  }, [muscleGroup, search]);

  useEffect(() => { fetchMe(); }, []);
  useEffect(() => { fetchExercises(); }, [fetchExercises]);

  // Onay bekleyen global egzersizler (sadece admin görür)
  const pendingExercises = useMemo(
    () => exercises.filter((ex) => ex.scope === "global" && ex.status === "pending"),
    [exercises]
  );

  function toggleSelectMode() {
    setSelectMode((prev) => !prev);
    setSelected(new Set());
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(pendingExercises.map((ex) => ex.id)));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function approveSelected() {
    if (selected.size === 0) return;
    setApproving(true);
    try {
      const res = await fetch("/api/exercises/bulk-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selected] }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Onaylama başarısız.");
        return;
      }
      toast.success(`${data.approved} egzersiz onaylandı.`);
      setSelectMode(false);
      setSelected(new Set());
      fetchExercises();
    } catch {
      toast.error("Sunucuya bağlanılamadı.");
    } finally {
      setApproving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu egzersizi silmek istediğine emin misin?")) return;
    const res = await fetch(`/api/exercises/${id}`, { method: "DELETE" });
    if (res.ok) toast.success("Egzersiz silindi.");
    else toast.error("Silinemedi.");
    fetchExercises();
  }

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(ex: Exercise) {
    setEditing(ex);
    setDialogOpen(true);
  }

  function handleSuccess() {
    setDialogOpen(false);
    fetchExercises();
  }

  const isAdmin = me?.role === "admin";
  const hasPending = pendingExercises.length > 0;
  const allPendingSelected =
    pendingExercises.length > 0 &&
    pendingExercises.every((ex) => selected.has(ex.id));

  return (
    <main className="max-w-4xl mx-auto p-6 flex flex-col gap-6 pb-32">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Egzersizler</h1>
        <div className="flex items-center gap-2">
          {isAdmin && hasPending && !selectMode && (
            <Button variant="outline" size="sm" onClick={toggleSelectMode}>
              <Check size={15} className="mr-1.5" />
              Çoklu Onayla
            </Button>
          )}
          {!selectMode && (
            <Button onClick={openCreate} size="sm">
              <Plus size={16} className="mr-1" />
              Yeni Egzersiz
            </Button>
          )}
        </div>
      </div>

      {!selectMode && (
        <>
          <Input
            placeholder="Egzersiz ara…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <MuscleGroupFilter value={muscleGroup} onChange={setMuscleGroup} />
        </>
      )}

      {/* Seçim modu bilgi çubuğu */}
      {selectMode && (
        <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/50 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">
              {selected.size > 0
                ? `${selected.size} egzersiz seçildi`
                : "Onaylanacak egzersizleri seç"}
            </span>
            <span className="text-xs text-muted-foreground">
              ({pendingExercises.length} bekleyen)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={allPendingSelected ? clearSelection : selectAll}
            >
              {allPendingSelected ? "Seçimi Kaldır" : "Tümünü Seç"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSelectMode}
            >
              <X size={15} className="mr-1" />
              İptal
            </Button>
          </div>
        </div>
      )}

      {exercises.length === 0 ? (
        <p className="text-muted-foreground text-sm">Egzersiz bulunamadı.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map((ex) => {
            const isPending = ex.scope === "global" && ex.status === "pending";
            const isSelectable = selectMode && isPending;
            return (
              <ExerciseCard
                key={ex.id}
                exercise={ex}
                currentUserId={me?.id ?? ""}
                isAdmin={isAdmin}
                onEdit={openEdit}
                onDelete={handleDelete}
                selectable={isSelectable}
                selected={selected.has(ex.id)}
                onSelect={toggleSelect}
              />
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Egzersizi Düzenle" : "Yeni Egzersiz"}
            </DialogTitle>
          </DialogHeader>
          <ExerciseForm
            initial={editing ?? undefined}
            isAdmin={isAdmin}
            onSuccess={handleSuccess}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Sticky onay çubuğu */}
      {selectMode && (
        <div className="fixed bottom-0 left-0 right-0 sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 sm:w-fit z-50">
          <div className="flex items-center gap-3 bg-background border shadow-lg px-5 py-3 sm:rounded-xl">
            <span className="text-sm font-medium text-muted-foreground">
              {selected.size} seçili
            </span>
            <Button
              disabled={selected.size === 0 || approving}
              onClick={approveSelected}
              size="sm"
            >
              <Check size={15} className="mr-1.5" />
              {approving ? "Onaylanıyor…" : `Onayla (${selected.size})`}
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
