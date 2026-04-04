"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
import { cn } from "@/lib/utils";
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
  const [level, setLevel] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  // Çoklu seçim
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [approving, setApproving] = useState(false);

  // Search debounce
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => { if (r.ok) r.json().then(setMe); });
  }, []);

  // Filtre değişince page'i 0'a sıfırla
  useEffect(() => {
    setPage(0);
    setExercises([]);
    setHasMore(true);
  }, [muscleGroup, level, debouncedSearch]);

  // Fetch — page veya filtre değişince çalışır
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    loadingRef.current = true;
    setLoading(true);

    (async () => {
      try {
        const params = new URLSearchParams({ page: String(page) });
        if (muscleGroup) params.set("muscleGroup", muscleGroup);
        if (level) params.set("level", level);
        if (debouncedSearch) params.set("search", debouncedSearch);
        const res = await fetch(`/api/exercises?${params}`, { signal: controller.signal });
        if (!res.ok) return;
        const json = await res.json();
        const data: Exercise[] = Array.isArray(json) ? json : (json.data ?? []);
        const more: boolean = json.hasMore ?? false;
        setExercises((prev) => (page === 0 ? data : [...prev, ...data]));
        setHasMore(more);
      } catch (e) {
        if (!(e instanceof Error && e.name === "AbortError")) throw e;
      } finally {
        if (active) {
          loadingRef.current = false;
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [page, muscleGroup, level, debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  // IntersectionObserver — sentinel görününce sonraki sayfayı yükle
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          setPage((p) => p + 1);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore]);

  // Onay bekleyen egzersizler (sadece admin)
  const pendingExercises = exercises.filter(
    (ex) => ex.scope === "global" && ex.status === "pending"
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
      setExercises([]);
      setHasMore(true);
      setPage(0);
    } catch {
      toast.error("Sunucuya bağlanılamadı.");
    } finally {
      setApproving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu egzersizi silmek istediğine emin misin?")) return;
    const res = await fetch(`/api/exercises/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Egzersiz silindi.");
      setExercises((prev) => prev.filter((ex) => ex.id !== id));
    } else {
      toast.error("Silinemedi.");
    }
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
    setExercises([]);
    setHasMore(true);
    setPage(0);
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
          <div className="flex gap-2">
            {[
              { value: null,           label: "Tümü",      active: "bg-foreground text-background border-foreground",         inactive: "border-border text-muted-foreground hover:bg-muted" },
              { value: "beginner",     label: "Başlangıç", active: "bg-emerald-500 text-white border-emerald-500",            inactive: "border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950" },
              { value: "intermediate", label: "Orta",      active: "bg-amber-500 text-white border-amber-500",               inactive: "border-amber-300 text-amber-600 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950" },
              { value: "expert",       label: "İleri",     active: "bg-rose-500 text-white border-rose-500",                 inactive: "border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-400 dark:hover:bg-rose-950" },
            ].map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => setLevel(opt.value)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm border transition-colors",
                  level === opt.value ? opt.active : opt.inactive
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
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
            <Button variant="ghost" size="sm" onClick={toggleSelectMode}>
              <X size={15} className="mr-1" />
              İptal
            </Button>
          </div>
        </div>
      )}

      {exercises.length === 0 && !loading ? (
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

      {/* Sentinel + loading indicator */}
      <div ref={sentinelRef} className="flex justify-center py-4">
        {loading && (
          <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
        )}
      </div>

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
