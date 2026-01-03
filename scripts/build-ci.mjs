#!/usr/bin/env node

/**
 * Smart CI build script for Vercel deployments.
 *
 * - `main` branch: Deploy Convex to production + build Next.js
 * - `dev` branch: Deploy Convex to dev + build Next.js
 * - Other branches (PR previews): Build Next.js only (no Convex deploy)
 *
 * Uses VERCEL_GIT_COMMIT_REF to determine the current branch.
 * Falls back to git branch detection for local testing.
 */

import { execSync } from 'node:child_process';

// Branches that should trigger Convex deployment
const DEPLOY_BRANCHES = ['main', 'dev'];

function getBranch() {
  // Vercel sets this during builds
  if (process.env.VERCEL_GIT_COMMIT_REF) {
    return process.env.VERCEL_GIT_COMMIT_REF;
  }

  // Fallback for local testing
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

function run(command) {
  console.log(`\n$ ${command}\n`);
  execSync(command, { stdio: 'inherit' });
}

const branch = getBranch();
console.log(`\n🔍 Detected branch: ${branch}`);

if (DEPLOY_BRANCHES.includes(branch)) {
  console.log(`✅ Branch "${branch}" is in deploy list - deploying Convex + building Next.js`);
  run('npx convex deploy --cmd \'next build\'');
} else {
  console.log(`ℹ️  Branch "${branch}" is not in deploy list - building Next.js only (no Convex deploy)`);
  run('next build');
}
