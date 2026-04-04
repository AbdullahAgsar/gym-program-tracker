import { NextRequest, NextResponse } from "next/server";
import { readJSON } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { calcProgress } from "@/lib/progress";
import type { Log } from "@/lib/types";

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/progress/[exerciseId]">
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const { exerciseId } = await ctx.params;
  const logs = readJSON<Log>("logs.json").filter(
    (l) => l.userId === session.id
  );

  return NextResponse.json(calcProgress(exerciseId, logs));
}
