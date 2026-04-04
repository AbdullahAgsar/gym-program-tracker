import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

export function generateId(): string {
  return crypto.randomUUID();
}

export function readJSON<T>(filename: string): T[] {
  const filePath = path.join(DATA_DIR, filename);
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

export function writeJSON<T>(filename: string, data: T[]): void {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}
