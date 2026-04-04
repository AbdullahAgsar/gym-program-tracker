"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { UserStatus } from "@/lib/constants";

interface SafeUser {
  id: string;
  username: string;
  role: string;
  status: UserStatus;
  createdAt: string;
}

const STATUS_LABELS: Record<UserStatus, string> = {
  active: "Aktif",
  pending: "Beklemede",
  inactive: "Pasif",
};

const STATUS_VARIANTS: Record<
  UserStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  pending: "secondary",
  inactive: "destructive",
};

export function UserTable() {
  const [users, setUsers] = useState<SafeUser[]>([]);

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/users");
    if (res.ok) setUsers(await res.json());
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function updateStatus(id: string, status: UserStatus) {
    const res = await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) toast.success("Kullanıcı durumu güncellendi.");
    else toast.error("Güncelleme başarısız.");
    fetchUsers();
  }

  if (users.length === 0) {
    return <p className="text-sm text-muted-foreground">Kullanıcı bulunamadı.</p>;
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left px-4 py-2 font-medium">Kullanıcı</th>
            <th className="text-left px-4 py-2 font-medium">Rol</th>
            <th className="text-left px-4 py-2 font-medium">Durum</th>
            <th className="text-left px-4 py-2 font-medium">Değiştir</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3 font-medium">{u.username}</td>
              <td className="px-4 py-3 text-muted-foreground">{u.role}</td>
              <td className="px-4 py-3">
                <Badge variant={STATUS_VARIANTS[u.status]}>
                  {STATUS_LABELS[u.status]}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <Select
                  value={u.status}
                  onValueChange={(v) => updateStatus(u.id, v as UserStatus)}
                >
                  <SelectTrigger className="h-8 w-36 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="pending">Beklemede</SelectItem>
                    <SelectItem value="inactive">Pasif</SelectItem>
                  </SelectContent>
                </Select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
