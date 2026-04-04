"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  programId: string;
  userRating: number | null;
  average: number;
  count: number;
  isOwner: boolean;
  onRate: (programId: string, rating: number | null) => void;
}

export function StarRating({
  programId,
  userRating,
  average,
  count,
  isOwner,
  onRate,
}: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const displayRating = hover ?? userRating ?? 0;
  const disabled = isOwner || loading;

  async function handleRate(star: number) {
    if (disabled) return;
    setLoading(true);

    // Aynı yıldıza tıklanırsa puanı kaldır
    const removing = userRating === star;

    try {
      const res = await fetch(`/api/programs/${programId}/rate`, {
        method: removing ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: removing ? undefined : JSON.stringify({ rating: star }),
      });
      if (res.ok) {
        onRate(programId, removing ? null : star);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {/* Yıldızlar */}
      <div
        className="flex items-center gap-0.5"
        onMouseLeave={() => !disabled && setHover(null)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= displayRating;
          return (
            <button
              key={star}
              type="button"
              disabled={disabled}
              onClick={() => handleRate(star)}
              onMouseEnter={() => !disabled && setHover(star)}
              className={cn(
                "transition-transform",
                !disabled && "hover:scale-110 cursor-pointer",
                disabled && "cursor-default"
              )}
            >
              <Star
                size={16}
                className={cn(
                  "transition-colors",
                  filled
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-transparent text-muted-foreground"
                )}
              />
            </button>
          );
        })}
      </div>

      {/* Ortalama ve sayı */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {count > 0 ? (
          <>
            <span className="font-medium text-foreground tabular-nums">
              {average.toFixed(1)}
            </span>
            <span>/ 5</span>
            <span>({count})</span>
          </>
        ) : (
          <span>{isOwner ? "Henüz puan yok" : "İlk puanı sen ver"}</span>
        )}
      </div>
    </div>
  );
}
