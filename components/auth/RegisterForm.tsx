"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const username = (form.elements.namedItem("username") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const passwordConfirm = (form.elements.namedItem("passwordConfirm") as HTMLInputElement).value;

    if (password !== passwordConfirm) {
      toast.error("Şifreler eşleşmiyor.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Bir hata oluştu.");
        return;
      }

      router.push("/calendar");
      router.refresh();
    } catch {
      toast.error("Sunucuya bağlanılamadı.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Kayıt Ol</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="username">Kullanıcı Adı</Label>
            <Input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              minLength={3}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Şifre</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="passwordConfirm">Şifre Tekrar</Label>
            <Input
              id="passwordConfirm"
              name="passwordConfirm"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Kaydediliyor…" : "Kayıt Ol"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Zaten hesabın var mı?{" "}
            <Link href="/login" className="underline underline-offset-2 hover:text-foreground">
              Giriş Yap
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
