/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as credits from "../credits.js";
import type * as essays from "../essays.js";
import type * as gradeFailures from "../gradeFailures.js";
import type * as grades from "../grades.js";
import type * as grading from "../grading.js";
import type * as http from "../http.js";
import type * as lib_ai from "../lib/ai.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_decimal from "../lib/decimal.js";
import type * as lib_gradingPrompt from "../lib/gradingPrompt.js";
import type * as lib_gradingSchema from "../lib/gradingSchema.js";
import type * as platformSettings from "../platformSettings.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  credits: typeof credits;
  essays: typeof essays;
  gradeFailures: typeof gradeFailures;
  grades: typeof grades;
  grading: typeof grading;
  http: typeof http;
  "lib/ai": typeof lib_ai;
  "lib/auth": typeof lib_auth;
  "lib/decimal": typeof lib_decimal;
  "lib/gradingPrompt": typeof lib_gradingPrompt;
  "lib/gradingSchema": typeof lib_gradingSchema;
  platformSettings: typeof platformSettings;
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
