"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "./StarRating";
import type { FeedItem } from "@/app/api/feed/route";

const MUSCLE_LABELS: Record<string, string> = {
  legs: "Bacak", forearm: "Ön Kol", upperArm: "Üst Kol",
  shoulder: "Omuz", wrist: "Bilek", chest: "Göğüs", abs: "Karın", back: "Sırt",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "az önce";
  if (mins < 60) return `${mins} dakika önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} gün önce`;
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
}

interface Props {
  item: FeedItem;
}

export function FeedCard({ item }: Props) {
  const [ratingAverage, setRatingAverage] = useState(item.ratingAverage);
  const [ratingCount, setRatingCount] = useState(item.ratingCount);
  const [userRating, setUserRating] = useState<number | null>(item.userRating);

  function handleRate(programId: string, newRating: number | null) {
    // Optimistik güncelleme — gerçek veriyi feed yeniden yüklenince alır
    // Burada sadece local state güncellenir
    const oldRating = userRating;
    const oldCount = ratingCount;
    const oldAvg = ratingAverage;

    if (newRating === null && oldRating !== null) {
      // Puan kaldırıldı
      const newCount = oldCount - 1;
      const newAvg =
        newCount === 0 ? 0 : (oldAvg * oldCount - oldRating) / newCount;
      setRatingCount(newCount);
      setRatingAverage(Math.round(newAvg * 10) / 10);
    } else if (newRating !== null && oldRating === null) {
      // Yeni puan
      const newCount = oldCount + 1;
      const newAvg = (oldAvg * oldCount + newRating) / newCount;
      setRatingCount(newCount);
      setRatingAverage(Math.round(newAvg * 10) / 10);
    } else if (newRating !== null && oldRating !== null) {
      // Puan güncellendi
      const newAvg = (oldAvg * oldCount - oldRating + newRating) / oldCount;
      setRatingAverage(Math.round(newAvg * 10) / 10);
    }

    setUserRating(newRating);
  }

  return (
    <div className="rounded-lg border bg-card p-4 flex flex-col gap-3">
      <div>
        <p className="text-sm">
          <span className="font-semibold">{item.username}</span>{" "}
          <span className="text-muted-foreground">{timeAgo(item.createdAt)}</span>{" "}
          <span className="font-medium">{item.programName}</span> programı oluşturdu.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {item.muscleGroups.map((mg) => (
          <Badge key={mg} variant="secondary" className="text-xs">
            {MUSCLE_LABELS[mg] ?? mg}
          </Badge>
        ))}
      </div>

      {item.exerciseNames.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {item.exerciseNames.join(" · ")}
        </p>
      )}

      <div className="border-t pt-3">
        <StarRating
          programId={item.programId}
          userRating={userRating}
          average={ratingAverage}
          count={ratingCount}
          isOwner={item.isOwner}
          onRate={handleRate}
        />
        {item.isOwner && (
          <p className="text-xs text-muted-foreground mt-1">
            Kendi programını puanlayamazsın.
          </p>
        )}
        {!item.isOwner && userRating !== null && (
          <p className="text-xs text-muted-foreground mt-1">
            Puanını değiştirmek için yeni bir yıldıza, kaldırmak için aynı yıldıza tıkla.
          </p>
        )}
      </div>
    </div>
  );
}
