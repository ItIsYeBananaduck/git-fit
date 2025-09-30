// Client service to fetch and cache AI config from Convex
import { convex } from '$lib/convex';
import { api } from '$lib/convex';

export type AiConfig = {
  deviceWeights: Record<string, Record<string, number>>;
  thresholds: {
    readiness: { low: number; moderate: number };
    recovery: { low: number; moderate: number };
    sleep: { lowHours: number };
  };
  trainingRules: {
    deloadOnLowReadiness: boolean;
    volumeReductionPct: number;
    restIncreaseSeconds: number;
  };
  nutritionRules: {
    increaseCarbsOnLowRecovery: boolean;
    carbBoostPct: number;
    proteinMinGPerKg: number;
  };
};

let cachedConfig: AiConfig | null = null;
let lastFetched = 0;
const TTL_MS = 60 * 1000;

export async function fetchAiConfig(force = false): Promise<AiConfig> {
  const now = Date.now();
  if (!force && cachedConfig && now - lastFetched < TTL_MS) return cachedConfig;
  const cfg = (await convex.query(api.functions.aiConfig.getConfig, {} as any)) as AiConfig;
  cachedConfig = cfg;
  lastFetched = now;
  return cfg;
}
