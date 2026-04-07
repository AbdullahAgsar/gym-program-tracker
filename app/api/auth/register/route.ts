import { NextRequest, NextResponse } from "next/server";
import { db, generateId } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { hashPassword, signToken, setSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body?.username || !body?.password) {
    return NextResponse.json(
      { error: "Kullanıcı adı ve şifre zorunludur." },
      { status: 400 }
    );
  }

  const username: string = body.username.trim();
  const password: string = body.password;

  if (username.length < 3) {
    return NextResponse.json(
      { error: "Kullanıcı adı en az 3 karakter olmalıdır." },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Şifre en az 6 karakter olmalıdır." },
      { status: 400 }
    );
  }

  const existing = db.select().from(users).where(eq(users.username, username)).get();
  if (existing) {
    return NextResponse.json(
      { error: "Bu kullanıcı adı zaten kullanılıyor." },
      { status: 409 }
    );
  }

  const hashed = await hashPassword(password);
  const id = generateId();

  db.insert(users).values({
    id,
    username,
    password: hashed,
    role: "user",
    status: "active",
    createdAt: new Date().toISOString(),
  }).run();

  const token = await signToken({ id, username, role: "user" });
  await setSessionCookie(token);

  return NextResponse.json({ username, role: "user" }, { status: 201 });
}
