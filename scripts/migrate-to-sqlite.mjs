/**
 * Migrate data from JSON files to SQLite database.
 * Run once: node scripts/migrate-to-sqlite.mjs
 */

import Database from "better-sqlite3";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");
const DB_PATH = join(DATA_DIR, "gym.db");

function readJson(filename) {
  const p = join(DATA_DIR, filename);
  if (!existsSync(p)) return [];
  try { return JSON.parse(readFileSync(p, "utf-8")); } catch { return []; }
}

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

// ─── Create tables if not exists ──────────────────────────────────────────────
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS exercises (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    muscle_group TEXT NOT NULL,
    instructions TEXT,
    level TEXT,
    equipment TEXT,
    primary_muscles TEXT,
    secondary_muscles TEXT,
    images TEXT,
    media_url TEXT,
    media_type TEXT,
    scope TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_by TEXT NOT NULL,
    ratings TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS programs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    exercises TEXT NOT NULL DEFAULT '[]',
    ratings TEXT NOT NULL DEFAULT '[]',
    is_public INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    program_ids TEXT NOT NULL DEFAULT '[]',
    exercises TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL
  );
`);
console.log("✓ Tables ready");

const j = (v) => JSON.stringify(v ?? null);

// ─── Users ────────────────────────────────────────────────────────────────────
const users = readJson("users.json");
const insertUser = sqlite.prepare(`
  INSERT OR IGNORE INTO users (id, username, password, role, status, created_at)
  VALUES (@id, @username, @password, @role, @status, @createdAt)
`);

let userCount = 0;
const insertUsers = sqlite.transaction(() => {
  for (const u of users) {
    insertUser.run({
      id: u.id,
      username: u.username,
      password: u.password,
      role: u.role ?? "user",
      status: u.status ?? "active",
      createdAt: u.createdAt ?? new Date().toISOString(),
    });
    userCount++;
  }
});
insertUsers();
console.log(`✓ Users: ${userCount}`);

// ─── Exercises ────────────────────────────────────────────────────────────────
const exercises = readJson("exercises.json");
const insertExercise = sqlite.prepare(`
  INSERT OR IGNORE INTO exercises (
    id, name, muscle_group, instructions, level, equipment,
    primary_muscles, secondary_muscles, images,
    media_url, media_type, scope, status, created_by, ratings, created_at
  ) VALUES (
    @id, @name, @muscleGroup, @instructions, @level, @equipment,
    @primaryMuscles, @secondaryMuscles, @images,
    @mediaUrl, @mediaType, @scope, @status, @createdBy, @ratings, @createdAt
  )
`);

let exCount = 0;
const insertExercises = sqlite.transaction(() => {
  for (const ex of exercises) {
    insertExercise.run({
      id: ex.id,
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      instructions: ex.instructions ? j(ex.instructions) : null,
      level: ex.level ?? null,
      equipment: ex.equipment ?? null,
      primaryMuscles: ex.primaryMuscles ? j(ex.primaryMuscles) : null,
      secondaryMuscles: ex.secondaryMuscles ? j(ex.secondaryMuscles) : null,
      images: ex.images ? j(ex.images) : null,
      mediaUrl: ex.mediaUrl ?? null,
      mediaType: ex.mediaType ?? null,
      scope: ex.scope,
      status: ex.status ?? "pending",
      createdBy: ex.createdBy,
      ratings: j(ex.ratings ?? []),
      createdAt: ex.createdAt ?? new Date().toISOString(),
    });
    exCount++;
  }
});
insertExercises();
console.log(`✓ Exercises: ${exCount}`);

// ─── Programs ─────────────────────────────────────────────────────────────────
const programs = readJson("programs.json");
const insertProgram = sqlite.prepare(`
  INSERT OR IGNORE INTO programs (id, user_id, name, exercises, ratings, is_public, created_at)
  VALUES (@id, @userId, @name, @exercises, @ratings, @isPublic, @createdAt)
`);

let progCount = 0;
const insertPrograms = sqlite.transaction(() => {
  for (const p of programs) {
    insertProgram.run({
      id: p.id,
      userId: p.userId,
      name: p.name,
      exercises: j(p.exercises ?? []),
      ratings: j(p.ratings ?? []),
      isPublic: p.isPublic ? 1 : 0,
      createdAt: p.createdAt ?? new Date().toISOString(),
    });
    progCount++;
  }
});
insertPrograms();
console.log(`✓ Programs: ${progCount}`);

// ─── Logs ─────────────────────────────────────────────────────────────────────
const logs = readJson("logs.json");
const insertLog = sqlite.prepare(`
  INSERT OR IGNORE INTO logs (id, user_id, date, program_ids, exercises, created_at)
  VALUES (@id, @userId, @date, @programIds, @exercises, @createdAt)
`);

let logCount = 0;
const insertLogs = sqlite.transaction(() => {
  for (const l of logs) {
    insertLog.run({
      id: l.id,
      userId: l.userId,
      date: l.date,
      programIds: j(l.programIds ?? []),
      exercises: j(l.exercises ?? []),
      createdAt: l.createdAt ?? new Date().toISOString(),
    });
    logCount++;
  }
});
insertLogs();
console.log(`✓ Logs: ${logCount}`);

console.log("\n✅ Migration complete!");
sqlite.close();
