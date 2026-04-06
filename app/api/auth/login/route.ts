import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, mapUser } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { signToken, setSessionCookie, verifyPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body?.username || !body?.password) {
    return NextResponse.json(
      { error: "Kullanıcı adı ve şifre zorunludur." },
      { status: 400 }
    );
  }

  const row = db.select().from(users).where(eq(users.username, body.username)).get();

  if (!row) {
    return NextResponse.json(
      { error: "Kullanıcı adı veya şifre hatalı." },
      { status: 401 }
    );
  }

  const user = mapUser(row);

  const passwordOk = await verifyPassword(body.password, user.password);
  if (!passwordOk) {
    return NextResponse.json(
      { error: "Kullanıcı adı veya şifre hatalı." },
      { status: 401 }
    );
  }

  if (user.status !== "active") {
    const messages: Record<string, string> = {
      pending: "Hesabınız henüz onaylanmadı.",
      inactive: "Hesabınız devre dışı bırakıldı.",
    };
    return NextResponse.json(
      { error: messages[user.status] ?? "Giriş yapılamıyor." },
      { status: 403 }
    );
  }

  const token = await signToken({
    id: user.id,
    username: user.username,
    role: user.role,
  });

  await setSessionCookie(token);

  return NextResponse.json({ username: user.username, role: user.role });
}
