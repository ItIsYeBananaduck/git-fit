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
import type * as functions_exercises from "../functions/exercises.js";
import type * as functions_fitnessData from "../functions/fitnessData.js";
import type * as functions_marketplace from "../functions/marketplace.js";
import type * as functions_trainingPrograms from "../functions/trainingPrograms.js";
import type * as functions_users from "../functions/users.js";
import type * as functions_whoop from "../functions/whoop.js";
import type * as functions_workouts from "../functions/workouts.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "functions/exercises": typeof functions_exercises;
  "functions/fitnessData": typeof functions_fitnessData;
  "functions/marketplace": typeof functions_marketplace;
  "functions/trainingPrograms": typeof functions_trainingPrograms;
  "functions/users": typeof functions_users;
  "functions/whoop": typeof functions_whoop;
  "functions/workouts": typeof functions_workouts;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
