import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, mapUser } from "@/lib/schema";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const rows = db.select().from(users).all();
  const result = rows.map((row) => {
    const user = mapUser(row);
    return { id: user.id, username: user.username, role: user.role, status: user.status, createdAt: user.createdAt };
  });

  return NextResponse.json(result);
}
