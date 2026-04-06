import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { exercises, programs, users, mapProgram, mapExercise, mapUser } from "@/lib/schema";
import { getSession } from "@/lib/auth";

export interface FeedItem {
  programId: string;
  programName: string;
  username: string;
  isOwner: boolean;
  muscleGroups: string[];
  exerciseNames: string[];
  createdAt: string;
  ratingAverage: number;
  ratingCount: number;
  userRating: number | null;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const allPrograms = db.select().from(programs).all().map(mapProgram);
  const allUsers = db.select().from(users).all().map(mapUser);
  const allExercises = db.select().from(exercises).all().map(mapExercise);

  const userMap = new Map(allUsers.map((u) => [u.id, u.username]));
  const exerciseMap = new Map(allExercises.map((ex) => [ex.id, ex.name]));

  const feed: FeedItem[] = allPrograms
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((p) => {
      const ratings = p.ratings ?? [];
      const avg =
        ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
          : 0;
      const userRating =
        ratings.find((r) => r.userId === session.id)?.rating ?? null;

      return {
        programId: p.id,
        programName: p.name,
        username: userMap.get(p.userId) ?? "Bilinmeyen",
        isOwner: p.userId === session.id,
        muscleGroups: [...new Set(p.exercises.map((e) => e.muscleGroup))],
        exerciseNames: p.exercises
          .map((e) => exerciseMap.get(e.exerciseId))
          .filter((n): n is string => !!n),
        createdAt: p.createdAt,
        ratingAverage: Math.round(avg * 10) / 10,
        ratingCount: ratings.length,
        userRating,
      };
    });

  return NextResponse.json(feed);
}
