export interface ProgressionScheme {
  name: string;
  rules: Array<{
    metric: string;
    condition: string;
    adjustment: {
      load?: number;
      reps?: number;
      rest?: number;
    };
  }>;
}

export interface AdaptationRecord {
  date: string;
  adaptationType: string;
  details: string;
}

export interface Exercise {
  id: string;
  name: string;
  force?: string;
  level: string;
  mechanic?: string;
  equipment?: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  images: string[];
}

export interface VolumeMetrics {
  load: number;
  reps: number;
  sets: number;
  totalVolume: number;
}