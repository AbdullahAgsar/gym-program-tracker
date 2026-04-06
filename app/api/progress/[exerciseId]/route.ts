import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logs, mapLog } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { calcProgress } from "@/lib/progress";

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/progress/[exerciseId]">
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const { exerciseId } = await ctx.params;
  const userLogs = db.select().from(logs).where(eq(logs.userId, session.id)).all().map(mapLog);

  return NextResponse.json(calcProgress(exerciseId, userLogs));
}
