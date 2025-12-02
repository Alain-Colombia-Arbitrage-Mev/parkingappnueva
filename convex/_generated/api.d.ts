/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auctions from "../auctions.js";
import type * as auth from "../auth.js";
import type * as authUsers from "../authUsers.js";
import type * as flashDeals from "../flashDeals.js";
import type * as help from "../help.js";
import type * as jobs from "../jobs.js";
import type * as payments from "../payments.js";
import type * as profiles from "../profiles.js";
import type * as reviews from "../reviews.js";
import type * as seed from "../seed.js";
import type * as seedComprehensive from "../seedComprehensive.js";
import type * as storage from "../storage.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auctions: typeof auctions;
  auth: typeof auth;
  authUsers: typeof authUsers;
  flashDeals: typeof flashDeals;
  help: typeof help;
  jobs: typeof jobs;
  payments: typeof payments;
  profiles: typeof profiles;
  reviews: typeof reviews;
  seed: typeof seed;
  seedComprehensive: typeof seedComprehensive;
  storage: typeof storage;
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
