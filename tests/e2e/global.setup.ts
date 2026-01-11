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
  // Setup testing token to bypass bot detection
  await setupClerkTestingToken({ page });

  // Start at homepage (public page that loads successfully)
  await page.goto('/');

  // Click sign-in link to navigate to sign-in page
  await page.getByRole('link', { name: /sign in/i }).first().click();

  // Wait for Clerk sign-in form to load (use placeholder or label)
  const emailInput = page.locator('input[name="identifier"], input[type="email"]').first();

  await expect(emailInput).toBeVisible({ timeout: 10000 });

  // Sign in through the UI
  await emailInput.fill(process.env.E2E_CLERK_USER_USERNAME!);
  await page.getByRole('button', { name: /continue/i }).click();

  // Wait for password field and fill it
  const passwordInput = page.locator('input[type="password"]');

  await expect(passwordInput).toBeVisible({ timeout: 10000 });

  await passwordInput.fill(process.env.E2E_CLERK_USER_PASSWORD!);
  await page.getByRole('button', { name: /continue/i }).click();

  // Wait for redirect to dashboard (auth successful)
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

  // Save auth state for subsequent tests
  await page.context().storageState({ path: authFile });
});
