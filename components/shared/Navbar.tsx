"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Dumbbell,
  LayoutList,
  Rss,
  TrendingUp,
  ShieldCheck,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/calendar", label: "Takvim", icon: <Calendar size={18} /> },
  { href: "/exercises", label: "Egzersizler", icon: <Dumbbell size={18} /> },
  { href: "/programs", label: "Programlar", icon: <LayoutList size={18} /> },
  { href: "/feed", label: "Akış", icon: <Rss size={18} /> },
  { href: "/progress", label: "Gelişim", icon: <TrendingUp size={18} /> },
  { href: "/admin", label: "Admin", icon: <ShieldCheck size={18} />, adminOnly: true },
];

interface Props {
  username: string;
  role: string;
}

export function Navbar({ username, role }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const items = NAV_ITEMS.filter((item) => !item.adminOnly || role === "admin");

  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/calendar" className="font-bold text-base tracking-tight">
          GymTracker
        </Link>

        {/* Nav links */}
        <div className="hidden sm:flex items-center gap-1">
          {items.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* User + theme + logout */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:block">
            {username}
          </span>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="h-8 w-8"
          >
            {mounted && resolvedTheme === "dark" ? (
              <Sun size={15} />
            ) : (
              <Moon size={15} />
            )}
          </Button>
          <Button size="sm" variant="ghost" onClick={handleLogout}>
            <LogOut size={15} className="mr-1" />
            <span className="hidden sm:inline">Çıkış</span>
          </Button>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="sm:hidden flex border-t fixed bottom-0 left-0 right-0 bg-background z-50">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs transition-colors",
                active
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
