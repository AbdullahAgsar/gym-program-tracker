import { NextRequest, NextResponse } from "next/server";
import { readJSON, writeJSON } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { USER_STATUSES } from "@/lib/constants";
import type { User } from "@/lib/types";

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

  const users = readJSON<User>("users.json");
  const index = users.findIndex((u) => u.id === id);

  if (index === -1) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
  }

  users[index] = { ...users[index], status: body.status };
  writeJSON("users.json", users);

  const { password: _pwd, ...safe } = users[index];
  return NextResponse.json(safe);
}
