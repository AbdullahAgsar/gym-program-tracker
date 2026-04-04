import type {
  MuscleGroup,
  Role,
  UserStatus,
  ExerciseScope,
  ExerciseStatus,
  MediaType,
} from "./constants";

export interface User {
  id: string;
  username: string;
  password: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
}

export interface ExerciseRating {
  userId: string;
  rating: number; // 1-5
  createdAt: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  // imported fields
  instructions?: string[];
  level?: "beginner" | "intermediate" | "expert";
  equipment?: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  images?: string[];        // paths under /exercises/<id>/*.jpg
  // user-uploaded media (custom exercises)
  mediaUrl?: string;
  mediaType?: MediaType;
  scope: ExerciseScope;
  status: ExerciseStatus;
  createdBy: string;
  ratings: ExerciseRating[];
  createdAt: string;
}

export interface ProgramExercise {
  exerciseId: string;
  muscleGroup: MuscleGroup;
  targetSets: number;
  targetReps: number;
  targetWeight: number;
}

export interface ProgramRating {
  userId: string;
  rating: number; // 1-5
  createdAt: string;
}

export interface Program {
  id: string;
  userId: string;
  name: string;
  exercises: ProgramExercise[];
  ratings: ProgramRating[];
  isPublic: boolean;
  createdAt: string;
}

export interface LogSet {
  setNumber: number;
  reps?: number;
  weight?: number;
  done: boolean;
}

export interface LogExercise {
  exerciseId: string;
  programId: string;
  completed: boolean;
  sets: LogSet[];
}

export interface Log {
  id: string;
  userId: string;
  date: string;
  programIds: string[];
  exercises: LogExercise[];
  createdAt: string;
}
