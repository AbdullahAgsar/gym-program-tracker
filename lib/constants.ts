export const MUSCLE_GROUPS = [
  "legs",
  "forearm",
  "upperArm",
  "shoulder",
  "wrist",
  "chest",
  "abs",
  "back",
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const ROLES = ["admin", "user"] as const;
export type Role = (typeof ROLES)[number];

export const USER_STATUSES = ["active", "pending", "inactive"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const EXERCISE_SCOPES = ["global", "personal"] as const;
export type ExerciseScope = (typeof EXERCISE_SCOPES)[number];

export const EXERCISE_STATUSES = ["approved", "pending", "rejected"] as const;
export type ExerciseStatus = (typeof EXERCISE_STATUSES)[number];

export const MEDIA_TYPES = ["video", "image"] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];
