import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { programs } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function POST(
  _request: NextRequest,
  ctx: RouteContext<"/api/programs/[id]/publish">
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const row = db.select().from(programs).where(eq(programs.id, id)).get();

  if (!row) {
    return NextResponse.json({ error: "Program bulunamadı." }, { status: 404 });
  }

  if (row.userId !== session.id) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const newIsPublic = !row.isPublic;
  db.update(programs).set({ isPublic: newIsPublic }).where(eq(programs.id, id)).run();

  return NextResponse.json({ isPublic: newIsPublic });
}
