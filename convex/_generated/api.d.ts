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
import type * as crons from "../crons.js";
import type * as functions_achievements from "../functions/achievements.js";
import type * as functions_adaptiveRecommendations from "../functions/adaptiveRecommendations.js";
import type * as functions_ai_models from "../functions/ai-models.js";
import type * as functions_ai from "../functions/ai.js";
import type * as functions_aiService from "../functions/aiService.js";
import type * as functions_aiTraining from "../functions/aiTraining.js";
import type * as functions_compliance from "../functions/compliance.js";
import type * as functions_createPurchaseRecord from "../functions/createPurchaseRecord.js";
import type * as functions_createTrainerPayout from "../functions/createTrainerPayout.js";
import type * as functions_enhancedNutrition from "../functions/enhancedNutrition.js";
import type * as functions_equipment from "../functions/equipment.js";
import type * as functions_goals from "../functions/goals.js";
import type * as functions_musicDiscovery from "../functions/musicDiscovery.js";
import type * as functions_musicProcessing from "../functions/musicProcessing.js";
import type * as functions_musicRecommendationEngine from "../functions/musicRecommendationEngine.js";
import type * as functions_musicSync from "../functions/musicSync.js";
import type * as functions_musicSyncStatus from "../functions/musicSyncStatus.js";
import type * as functions_oauthAnalytics from "../functions/oauthAnalytics.js";
import type * as functions_oauthAuth from "../functions/oauthAuth.js";
import type * as functions_oauthErrorHandling from "../functions/oauthErrorHandling.js";
import type * as functions_oauthProviders from "../functions/oauthProviders.js";
import type * as functions_oauthSecurityAudit from "../functions/oauthSecurityAudit.js";
import type * as functions_oauthTokens from "../functions/oauthTokens.js";
import type * as functions_payments from "../functions/payments.js";
import type * as functions_platformOAuthRedirects from "../functions/platformOAuthRedirects.js";
import type * as functions_platformUI from "../functions/platformUI.js";
import type * as functions_providerSpecificFeatures from "../functions/providerSpecificFeatures.js";
import type * as functions_smartRecommendations from "../functions/smartRecommendations.js";
import type * as functions_stripeWebhook from "../functions/stripeWebhook.js";
import type * as functions_trainingSplits from "../functions/trainingSplits.js";
import type * as functions_updatePurchaseStatusBySubscriptionId from "../functions/updatePurchaseStatusBySubscriptionId.js";
import type * as functions_utils from "../functions/utils.js";
import type * as functions_voice from "../functions/voice.js";
import type * as lib_elevenLabsService from "../lib/elevenLabsService.js";
import type * as lib_huggingFaceService from "../lib/huggingFaceService.js";
import type * as lib_indexing_strategy from "../lib/indexing-strategy.js";
import type * as lib_musicServices from "../lib/musicServices.js";
import type * as lib_relationships from "../lib/relationships.js";
import type * as lib_validation from "../lib/validation.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  crons: typeof crons;
  "functions/achievements": typeof functions_achievements;
  "functions/adaptiveRecommendations": typeof functions_adaptiveRecommendations;
  "functions/ai-models": typeof functions_ai_models;
  "functions/ai": typeof functions_ai;
  "functions/aiService": typeof functions_aiService;
  "functions/aiTraining": typeof functions_aiTraining;
  "functions/compliance": typeof functions_compliance;
  "functions/createPurchaseRecord": typeof functions_createPurchaseRecord;
  "functions/createTrainerPayout": typeof functions_createTrainerPayout;
  "functions/enhancedNutrition": typeof functions_enhancedNutrition;
  "functions/equipment": typeof functions_equipment;
  "functions/goals": typeof functions_goals;
  "functions/musicDiscovery": typeof functions_musicDiscovery;
  "functions/musicProcessing": typeof functions_musicProcessing;
  "functions/musicRecommendationEngine": typeof functions_musicRecommendationEngine;
  "functions/musicSync": typeof functions_musicSync;
  "functions/musicSyncStatus": typeof functions_musicSyncStatus;
  "functions/oauthAnalytics": typeof functions_oauthAnalytics;
  "functions/oauthAuth": typeof functions_oauthAuth;
  "functions/oauthErrorHandling": typeof functions_oauthErrorHandling;
  "functions/oauthProviders": typeof functions_oauthProviders;
  "functions/oauthSecurityAudit": typeof functions_oauthSecurityAudit;
  "functions/oauthTokens": typeof functions_oauthTokens;
  "functions/payments": typeof functions_payments;
  "functions/platformOAuthRedirects": typeof functions_platformOAuthRedirects;
  "functions/platformUI": typeof functions_platformUI;
  "functions/providerSpecificFeatures": typeof functions_providerSpecificFeatures;
  "functions/smartRecommendations": typeof functions_smartRecommendations;
  "functions/stripeWebhook": typeof functions_stripeWebhook;
  "functions/trainingSplits": typeof functions_trainingSplits;
  "functions/updatePurchaseStatusBySubscriptionId": typeof functions_updatePurchaseStatusBySubscriptionId;
  "functions/utils": typeof functions_utils;
  "functions/voice": typeof functions_voice;
  "lib/elevenLabsService": typeof lib_elevenLabsService;
  "lib/huggingFaceService": typeof lib_huggingFaceService;
  "lib/indexing-strategy": typeof lib_indexing_strategy;
  "lib/musicServices": typeof lib_musicServices;
  "lib/relationships": typeof lib_relationships;
  "lib/validation": typeof lib_validation;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
