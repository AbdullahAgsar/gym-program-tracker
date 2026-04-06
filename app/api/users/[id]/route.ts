import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, mapUser } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { USER_STATUSES } from "@/lib/constants";

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/users/[id]">
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);

  if (!body?.status || !USER_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Geçersiz status." }, { status: 400 });
  }

  const row = db.select().from(users).where(eq(users.id, id)).get();

  if (!row) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
  }

  db.update(users).set({ status: body.status }).where(eq(users.id, id)).run();

  const updatedRow = db.select().from(users).where(eq(users.id, id)).get()!;
  const u = mapUser(updatedRow);
  return NextResponse.json({ id: u.id, username: u.username, role: u.role, status: u.status, createdAt: u.createdAt });
}
