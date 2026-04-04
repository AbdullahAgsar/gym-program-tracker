import { NextResponse } from "next/server";
import { readJSON } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { User } from "@/lib/types";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const users = readJSON<User>("users.json").map(
    ({ password: _pwd, ...rest }) => rest
  );

  return NextResponse.json(users);
}
