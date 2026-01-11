import path from 'node:path';

import { clerkSetup, setupClerkTestingToken } from '@clerk/testing/playwright';
import { expect, test as setup } from '@playwright/test';

setup.describe.configure({ mode: 'serial' });

// Initialize Clerk testing token
setup('global setup', async () => {
  await clerkSetup();
});

// Path to store authenticated session
const authFile = path.join(__dirname, '../../playwright/.clerk/user.json');

// Authenticate and save state for reuse
setup('authenticate', async ({ page }) => {
  // Clerk can be slow to load, increase timeout for this test
  setup.setTimeout(90000);
  // Setup testing token to bypass bot detection
  await setupClerkTestingToken({ page });

  // Start at homepage and navigate to sign-in
  await page.goto('/');
  await page.getByRole('link', { name: /sign in/i }).first().click();

  // Wait for URL to contain sign-in (Clerk redirect complete)
  await expect(page).toHaveURL(/sign-in/, { timeout: 10000 });

  // Wait for Clerk form to mount
  const emailInput = page.locator('.cl-formFieldInput, input[name="identifier"]').first();

  await expect(emailInput).toBeVisible({ timeout: 30000 });
  await expect(emailInput).toBeEnabled({ timeout: 5000 });

  // Sign in through the UI
  await emailInput.fill(process.env.E2E_CLERK_USER_USERNAME!);
  await page.getByRole('button', { name: /continue/i }).click();

  // Wait for password field to be visible AND enabled (Clerk validates email first)
  const passwordInput = page.locator('input[type="password"]');

  await expect(passwordInput).toBeVisible({ timeout: 15000 });
  await expect(passwordInput).toBeEnabled({ timeout: 15000 });

  // Fill password and submit
  await passwordInput.fill(process.env.E2E_CLERK_USER_PASSWORD!);
  await page.getByRole('button', { name: /continue/i }).click();

  // Wait for redirect to dashboard (auth successful) - Clerk can be slow in dev
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 45000 });

  // Save auth state for subsequent tests
  await page.context().storageState({ path: authFile });
});
