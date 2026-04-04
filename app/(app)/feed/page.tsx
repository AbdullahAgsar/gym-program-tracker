"use client";

import { useEffect, useState } from "react";
import { FeedCard } from "@/components/feed/FeedCard";
import type { FeedItem } from "@/app/api/feed/route";

export default function FeedPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/feed")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setItems(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Topluluk Akışı</h1>

      {loading ? (
        <p className="text-muted-foreground text-sm">Yükleniyor…</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Henüz paylaşılan program yok.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <FeedCard key={item.programId} item={item} />
          ))}
        </div>
      )}
    </main>
  );
}
