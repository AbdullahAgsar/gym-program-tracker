/**
 * Import exercises from free-exercise-db into data/exercises.json
 * and copy images to public/exercises/<id>/*.jpg
 *
 * Usage:
 *   node scripts/import-exercises.mjs /tmp/free-exercise-db
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SOURCE_DIR = process.argv[2] ?? "/tmp/free-exercise-db";

// ── Muscle group mapping ────────────────────────────────────────────────────
const MUSCLE_MAP = {
  abdominals: "abs",
  abductors: "legs",
  adductors: "legs",
  biceps: "upperArm",
  calves: "legs",
  chest: "chest",
  forearms: "forearm",
  glutes: "legs",
  hamstrings: "legs",
  lats: "back",
  "lower back": "back",
  "middle back": "back",
  neck: "shoulder",
  quadriceps: "legs",
  shoulders: "shoulder",
  traps: "back",
  triceps: "upperArm",
};

function mapMuscle(raw) {
  return MUSCLE_MAP[raw] ?? "back";
}

// ── Load source data ────────────────────────────────────────────────────────
const sourceJson = path.join(SOURCE_DIR, "dist", "exercises.json");
if (!fs.existsSync(sourceJson)) {
  console.error("exercises.json not found at", sourceJson);
  process.exit(1);
}
const raw = JSON.parse(fs.readFileSync(sourceJson, "utf8"));

// ── Prepare output dirs ─────────────────────────────────────────────────────
const imgDest = path.join(ROOT, "public", "exercises");
fs.mkdirSync(imgDest, { recursive: true });

// ── Transform & copy ────────────────────────────────────────────────────────
let copied = 0;
let skipped = 0;

const exercises = raw.map((ex) => {
  // copy images
  const images = [];
  for (const imgPath of ex.images ?? []) {
    const src = path.join(SOURCE_DIR, "exercises", imgPath);
    const dest = path.join(imgDest, imgPath);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      images.push(`/exercises/${imgPath}`);
      copied++;
    } else {
      skipped++;
    }
  }

  return {
    id: ex.id,
    name: ex.name,
    muscleGroup: mapMuscle(ex.primaryMuscles?.[0] ?? ""),
    instructions: ex.instructions ?? [],
    level: ex.level ?? undefined,
    equipment: ex.equipment ?? undefined,
    primaryMuscles: ex.primaryMuscles ?? [],
    secondaryMuscles: ex.secondaryMuscles ?? [],
    images,
    scope: "global",
    status: "approved",
    createdBy: "system",
    ratings: [],
    createdAt: new Date().toISOString(),
  };
});

// ── Write exercises.json ────────────────────────────────────────────────────
const dest = path.join(ROOT, "data", "exercises.json");
fs.writeFileSync(dest, JSON.stringify(exercises, null, 2), "utf8");

console.log(`✓ Imported ${exercises.length} exercises`);
console.log(`✓ Copied ${copied} images  (${skipped} missing skipped)`);
console.log(`✓ Written to ${dest}`);
