/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as functions_achievements from "../functions/achievements.js";
import type * as functions_adaptiveRecommendations from "../functions/adaptiveRecommendations.js";
import type * as functions_equipment from "../functions/equipment.js";
import type * as functions_goals from "../functions/goals.js";
import type * as functions_payments from "../functions/payments.js";
import type * as functions_smartRecommendations from "../functions/smartRecommendations.js";
import type * as functions_trainingSplits from "../functions/trainingSplits.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "functions/achievements": typeof functions_achievements;
  "functions/adaptiveRecommendations": typeof functions_adaptiveRecommendations;
  "functions/equipment": typeof functions_equipment;
  "functions/goals": typeof functions_goals;
  "functions/payments": typeof functions_payments;
  "functions/smartRecommendations": typeof functions_smartRecommendations;
  "functions/trainingSplits": typeof functions_trainingSplits;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
