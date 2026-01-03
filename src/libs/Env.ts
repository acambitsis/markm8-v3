import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

// Skip validation in CI to allow builds without secrets
const skipValidation = !!process.env.CI;

export const Env = createEnv({
  // Skip validation in CI environments (GitHub Actions, etc.)
  skipValidation,
  server: {
    CLERK_SECRET_KEY: z.string().min(1),
    CONVEX_DEPLOY_KEY: z.string().optional(), // For Convex deployment
    LOGTAIL_SOURCE_TOKEN: z.string().optional(),
    // Stripe keys for payment processing
    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
    BILLING_PLAN_ENV: z.enum(['dev', 'test', 'prod']).optional(),
    OPENROUTER_API_KEY: z.string().min(1).optional(), // Required for AI grading (Phase 5)
    MISTRAL_API_KEY: z.string().min(1).optional(), // Required for document OCR (Phase 4)
    CLERK_WEBHOOK_SECRET: z.string().min(1).optional(), // Required for user lifecycle (Phase 3)
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().optional(),
    NEXT_PUBLIC_CONVEX_URL: z.string().min(1), // Convex deployment URL
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().min(1),
    // Stripe publishable key for checkout
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_SENTRY_DSN: z.string().optional(), // Error monitoring
  },
  shared: {
    NODE_ENV: z.enum(['test', 'development', 'production']).optional(),
  },
  // You need to destructure all the keys manually
  runtimeEnv: {
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CONVEX_DEPLOY_KEY: process.env.CONVEX_DEPLOY_KEY,
    LOGTAIL_SOURCE_TOKEN: process.env.LOGTAIL_SOURCE_TOKEN,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    BILLING_PLAN_ENV: process.env.BILLING_PLAN_ENV,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NODE_ENV: process.env.NODE_ENV,
  },
});
