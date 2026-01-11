/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as credits from "../credits.js";
import type * as crons from "../crons.js";
import type * as documents from "../documents.js";
import type * as essays from "../essays.js";
import type * as gradeFailures from "../gradeFailures.js";
import type * as grades from "../grades.js";
import type * as grading from "../grading.js";
import type * as http from "../http.js";
import type * as lib_ai from "../lib/ai.js";
import type * as lib_aiConfig from "../lib/aiConfig.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_creditStateMachine from "../lib/creditStateMachine.js";
import type * as lib_decimal from "../lib/decimal.js";
import type * as lib_gradeSchema from "../lib/gradeSchema.js";
import type * as lib_grading_ai from "../lib/grading/ai.js";
import type * as lib_grading_index from "../lib/grading/index.js";
import type * as lib_grading_mock from "../lib/grading/mock.js";
import type * as lib_grading_utils from "../lib/grading/utils.js";
import type * as lib_gradingPrompt from "../lib/gradingPrompt.js";
import type * as lib_pricing from "../lib/pricing.js";
import type * as lib_slack from "../lib/slack.js";
import type * as modelCatalog from "../modelCatalog.js";
import type * as notifications from "../notifications.js";
import type * as platformSettings from "../platformSettings.js";
import type * as seed_migrations_addMaxTokensToGrading from "../seed/migrations/addMaxTokensToGrading.js";
import type * as seed_modelCatalog from "../seed/modelCatalog.js";
import type * as seed_platformSettings from "../seed/platformSettings.js";
import type * as suggestions from "../suggestions.js";
import type * as topicInsights from "../topicInsights.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  credits: typeof credits;
  crons: typeof crons;
  documents: typeof documents;
  essays: typeof essays;
  gradeFailures: typeof gradeFailures;
  grades: typeof grades;
  grading: typeof grading;
  http: typeof http;
  "lib/ai": typeof lib_ai;
  "lib/aiConfig": typeof lib_aiConfig;
  "lib/auth": typeof lib_auth;
  "lib/creditStateMachine": typeof lib_creditStateMachine;
  "lib/decimal": typeof lib_decimal;
  "lib/gradeSchema": typeof lib_gradeSchema;
  "lib/grading/ai": typeof lib_grading_ai;
  "lib/grading/index": typeof lib_grading_index;
  "lib/grading/mock": typeof lib_grading_mock;
  "lib/grading/utils": typeof lib_grading_utils;
  "lib/gradingPrompt": typeof lib_gradingPrompt;
  "lib/pricing": typeof lib_pricing;
  "lib/slack": typeof lib_slack;
  modelCatalog: typeof modelCatalog;
  notifications: typeof notifications;
  platformSettings: typeof platformSettings;
  "seed/migrations/addMaxTokensToGrading": typeof seed_migrations_addMaxTokensToGrading;
  "seed/modelCatalog": typeof seed_modelCatalog;
  "seed/platformSettings": typeof seed_platformSettings;
  suggestions: typeof suggestions;
  topicInsights: typeof topicInsights;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
