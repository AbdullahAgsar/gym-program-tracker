import { NextRequest, NextResponse } from "next/server";
import { readJSON } from "@/lib/db";
import { signToken, setSessionCookie, verifyPassword } from "@/lib/auth";
import type { Role, UserStatus } from "@/lib/constants";

interface User {
  id: string;
  username: string;
  password: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body?.username || !body?.password) {
    return NextResponse.json(
      { error: "Kullanıcı adı ve şifre zorunludur." },
      { status: 400 }
    );
  }

  const users = readJSON<User>("users.json");
  const user = users.find((u) => u.username === body.username);

  if (!user) {
    return NextResponse.json(
      { error: "Kullanıcı adı veya şifre hatalı." },
      { status: 401 }
    );
  }

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
