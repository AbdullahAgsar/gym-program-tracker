import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import type { Exercise, User, Program, Log } from "./types";

// ─── Tables ──────────────────────────────────────────────────────────────────

export const users = sqliteTable("users", {
  id:        text("id").primaryKey(),
  username:  text("username").notNull().unique(),
  password:  text("password").notNull(),
  role:      text("role").notNull().default("user"),
  status:    text("status").notNull().default("pending"),
  createdAt: text("created_at").notNull(),
});

export const exercises = sqliteTable("exercises", {
  id:               text("id").primaryKey(),
  name:             text("name").notNull(),
  muscleGroup:      text("muscle_group").notNull(),
  instructions:     text("instructions"),       // JSON string[]
  level:            text("level"),
  equipment:        text("equipment"),
  primaryMuscles:   text("primary_muscles"),    // JSON string[]
  secondaryMuscles: text("secondary_muscles"),  // JSON string[]
  images:           text("images"),             // JSON string[]
  mediaUrl:         text("media_url"),
  mediaType:        text("media_type"),
  scope:            text("scope").notNull(),
  status:           text("status").notNull().default("pending"),
  createdBy:        text("created_by").notNull(),
  ratings:          text("ratings").notNull().default("[]"), // JSON ExerciseRating[]
  createdAt:        text("created_at").notNull(),
});

export const programs = sqliteTable("programs", {
  id:        text("id").primaryKey(),
  userId:    text("user_id").notNull(),
  name:      text("name").notNull(),
  exercises: text("exercises").notNull().default("[]"), // JSON ProgramExercise[]
  ratings:   text("ratings").notNull().default("[]"),   // JSON ProgramRating[]
  isPublic:  integer("is_public", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export const logs = sqliteTable("logs", {
  id:         text("id").primaryKey(),
  userId:     text("user_id").notNull(),
  date:       text("date").notNull(),
  programIds: text("program_ids").notNull().default("[]"), // JSON string[]
  exercises:  text("exercises").notNull().default("[]"),   // JSON LogExercise[]
  createdAt:  text("created_at").notNull(),
});

// ─── Row → domain type mappers ───────────────────────────────────────────────

type ExerciseRow = typeof exercises.$inferSelect;
type UserRow     = typeof users.$inferSelect;
type ProgramRow  = typeof programs.$inferSelect;
type LogRow      = typeof logs.$inferSelect;

function jp<T>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback;
  try { return JSON.parse(val) as T; } catch { return fallback; }
}

export function mapExercise(row: ExerciseRow): Exercise {
  return {
    id:               row.id,
    name:             row.name,
    muscleGroup:      row.muscleGroup as Exercise["muscleGroup"],
    instructions:     jp(row.instructions, undefined),
    level:            (row.level ?? undefined) as Exercise["level"],
    equipment:        row.equipment ?? undefined,
    primaryMuscles:   jp(row.primaryMuscles, undefined),
    secondaryMuscles: jp(row.secondaryMuscles, undefined),
    images:           jp(row.images, undefined),
    mediaUrl:         row.mediaUrl ?? undefined,
    mediaType:        (row.mediaType ?? undefined) as Exercise["mediaType"],
    scope:            row.scope as Exercise["scope"],
    status:           row.status as Exercise["status"],
    createdBy:        row.createdBy,
    ratings:          jp(row.ratings, []),
    createdAt:        row.createdAt,
  };
}

export function mapUser(row: UserRow): User {
  return {
    id:        row.id,
    username:  row.username,
    password:  row.password,
    role:      row.role as User["role"],
    status:    row.status as User["status"],
    createdAt: row.createdAt,
  };
}

export function mapProgram(row: ProgramRow): Program {
  return {
    id:        row.id,
    userId:    row.userId,
    name:      row.name,
    exercises: jp(row.exercises, []),
    ratings:   jp(row.ratings, []),
    isPublic:  row.isPublic,
    createdAt: row.createdAt,
  };
}

export function mapLog(row: LogRow): Log {
  return {
    id:         row.id,
    userId:     row.userId,
    date:       row.date,
    programIds: jp(row.programIds, []),
    exercises:  jp(row.exercises, []),
    createdAt:  row.createdAt,
  };
}
