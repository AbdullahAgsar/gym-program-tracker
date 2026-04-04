"use client";

import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { UploadCloud, X, Film, Image as ImageIcon, Loader2 } from "lucide-react";

interface Props {
  mediaUrl?: string;
  mediaType?: string;
  onUpload: (url: string, type: string) => void;
  onRemove: () => void;
}

export function MediaUpload({ mediaUrl, mediaType, onUpload, onRemove }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Yükleme başarısız.");
        return;
      }
      onUpload(data.mediaUrl, data.mediaType);
      toast.success("Medya yüklendi.");
    } catch {
      toast.error("Dosya yüklenemedi.");
    } finally {
      setUploading(false);
    }
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    uploadFile(file);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragging(false);
  }, []);

  // Yüklenmiş medya önizlemesi
  if (mediaUrl) {
    return (
      <div className="relative rounded-lg overflow-hidden border bg-muted aspect-video group">
        {mediaType === "video" ? (
          <video src={mediaUrl} controls className="w-full h-full object-cover" />
        ) : (
          <img src={mediaUrl} alt="Önizleme" className="w-full h-full object-cover" />
        )}

        {/* Üst bilgi şeridi */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
          {mediaType === "video" ? <Film size={12} /> : <ImageIcon size={12} />}
          {mediaType === "video" ? "Video" : "Görsel"}
        </div>

        {/* Kaldır butonu */}
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X size={14} />
        </button>

        {/* Değiştir overlay */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 transition-colors opacity-0 group-hover:opacity-100"
        >
          <span className="text-white text-sm font-medium bg-black/60 px-3 py-1.5 rounded-md">
            Değiştir
          </span>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    );
  }

  // Yükleme alanı
  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => !uploading && inputRef.current?.click()}
      className={cn(
        "relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed cursor-pointer transition-colors py-8 px-4",
        dragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-muted/50"
      )}
    >
      {uploading ? (
        <>
          <Loader2 size={28} className="text-muted-foreground animate-spin" />
          <p className="text-sm text-muted-foreground">Yükleniyor…</p>
        </>
      ) : (
        <>
          <UploadCloud
            size={28}
            className={cn(
              "transition-colors",
              dragging ? "text-primary" : "text-muted-foreground"
            )}
          />
          <div className="text-center">
            <p className="text-sm font-medium">
              {dragging ? "Bırak!" : "Dosyayı sürükle veya tıkla"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              JPG, PNG, WEBP, GIF, MP4, WEBM — maks. 50 MB
            </p>
          </div>
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
