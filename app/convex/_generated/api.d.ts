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
import type * as functions_admin_analytics from "../functions/admin/analytics.js";
import type * as functions_admin_audit from "../functions/admin/audit.js";
import type * as functions_admin_auth from "../functions/admin/auth.js";
import type * as functions_admin_communication from "../functions/admin/communication.js";
import type * as functions_admin_moderation from "../functions/admin/moderation.js";
import type * as functions_admin_privacy from "../functions/admin/privacy.js";
import type * as functions_admin_roles from "../functions/admin/roles.js";
import type * as functions_admin_setup from "../functions/admin/setup.js";
import type * as functions_admin_support from "../functions/admin/support.js";
import type * as functions_admin_users from "../functions/admin/users.js";
import type * as functions_adminCertifications from "../functions/adminCertifications.js";
import type * as functions_exercises from "../functions/exercises.js";
import type * as functions_fitnessData from "../functions/fitnessData.js";
import type * as functions_goals from "../functions/goals.js";
import type * as functions_marketplace from "../functions/marketplace.js";
import type * as functions_marketplace from "../functions/marketplace.js";
import type * as functions_payments_createSubscriptionCheckoutSession from "../functions/payments/createSubscriptionCheckoutSession.js";
import type * as functions_payments_recordRevenueTransaction from "../functions/payments/recordRevenueTransaction.js";
import type * as functions_payments_stripeWebhook from "../functions/payments/stripeWebhook.js";
import type * as functions_payments from "../functions/payments.js";
import type * as functions_programOwnership from "../functions/programOwnership.js";
import type * as functions_programs from "../functions/programs.js";
import type * as functions_purchases from "../functions/purchases.js";
import type * as functions_recommendation from "../functions/recommendation.js";
import type * as functions_trainerCertifications from "../functions/trainerCertifications.js";
import type * as functions_trainers from "../functions/trainers.js";
import type * as functions_trainingPrograms from "../functions/trainingPrograms.js";
import type * as functions_upload from "../functions/upload.js";
import type * as functions_userConfigs from "../functions/userConfigs.js";
import type * as functions_userMonthlySummaries from "../functions/userMonthlySummaries.js";
import type * as functions_userYearlySummaries from "../functions/userYearlySummaries.js";
import type * as functions_users from "../functions/users.js";
import type * as functions_wearable from "../functions/wearable.js";
import type * as functions_whoop from "../functions/whoop.js";
import type * as functions_workouts from "../functions/workouts.js";
import type * as nutrition from "../nutrition.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "functions/admin/analytics": typeof functions_admin_analytics;
  "functions/admin/audit": typeof functions_admin_audit;
  "functions/admin/auth": typeof functions_admin_auth;
  "functions/admin/communication": typeof functions_admin_communication;
  "functions/admin/moderation": typeof functions_admin_moderation;
  "functions/admin/privacy": typeof functions_admin_privacy;
  "functions/admin/roles": typeof functions_admin_roles;
  "functions/admin/setup": typeof functions_admin_setup;
  "functions/admin/support": typeof functions_admin_support;
  "functions/admin/users": typeof functions_admin_users;
  "functions/adminCertifications": typeof functions_adminCertifications;
  "functions/exercises": typeof functions_exercises;
  "functions/fitnessData": typeof functions_fitnessData;
  "functions/goals": typeof functions_goals;
  "functions/marketplace": typeof functions_marketplace;
  "functions/marketplace": typeof functions_marketplace;
  "functions/payments/createSubscriptionCheckoutSession": typeof functions_payments_createSubscriptionCheckoutSession;
  "functions/payments/recordRevenueTransaction": typeof functions_payments_recordRevenueTransaction;
  "functions/payments/stripeWebhook": typeof functions_payments_stripeWebhook;
  "functions/payments": typeof functions_payments;
  "functions/programOwnership": typeof functions_programOwnership;
  "functions/programs": typeof functions_programs;
  "functions/purchases": typeof functions_purchases;
  "functions/recommendation": typeof functions_recommendation;
  "functions/trainerCertifications": typeof functions_trainerCertifications;
  "functions/trainers": typeof functions_trainers;
  "functions/trainingPrograms": typeof functions_trainingPrograms;
  "functions/upload": typeof functions_upload;
  "functions/userConfigs": typeof functions_userConfigs;
  "functions/userMonthlySummaries": typeof functions_userMonthlySummaries;
  "functions/userYearlySummaries": typeof functions_userYearlySummaries;
  "functions/users": typeof functions_users;
  "functions/wearable": typeof functions_wearable;
  "functions/whoop": typeof functions_whoop;
  "functions/workouts": typeof functions_workouts;
  nutrition: typeof nutrition;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
