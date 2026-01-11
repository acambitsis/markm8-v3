import { expect, test } from '@playwright/test';

// Test essay content (50+ words minimum required)
const TEST_ESSAY = `The Industrial Revolution fundamentally transformed society in ways that continue to shape our world today. Beginning in Britain during the late eighteenth century, this period marked a dramatic shift from agrarian economies to industrial manufacturing. New technologies such as the steam engine and spinning jenny enabled unprecedented productivity gains. Workers migrated from rural areas to urban centers seeking employment in factories. This essay examines the social and economic consequences of these profound changes, exploring both the immediate impacts and the lasting legacy of industrialization on modern society.`;

const TEST_TITLE = 'The Industrial Revolution and Its Impact';
const TEST_SUBJECT = 'History';

test.describe('Grading Flow', () => {
  // Increase timeout for this test suite (AI calls can be slow)
  test.setTimeout(60000);

  // Clear any existing draft before test runs
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/submit');

    const clearButton = page.getByRole('button', { name: /clear/i });
    const isVisible = await clearButton.isVisible().catch(() => false);

    if (isVisible) {
      await clearButton.click();
      await page.getByRole('button', { name: /clear draft/i }).click();
    }
  });

  test('submits essay and receives grade (happy path)', async ({ page }) => {
    // Step 1: Navigate to submit page
    await page.goto('/en/submit');

    await expect(page).toHaveURL(/\/submit/);

    // Step 2: Click "Paste or type" to reveal the textarea
    await page.getByRole('button', { name: /paste or type/i }).click();

    // Step 3: Fill essay content in the textarea
    const textarea = page.locator('textarea');

    await expect(textarea).toBeVisible({ timeout: 5000 });

    await textarea.fill(TEST_ESSAY);

    // Step 3: Wait for title/subject fields to appear (they show after content is entered)
    await expect(page.getByLabel(/title/i)).toBeVisible({ timeout: 5000 });

    // Step 4: Wait for AI suggestions to complete (if generating)
    // The "Generating..." text disappears when done
    // eslint-disable-next-line playwright/missing-playwright-await
    await expect(page.getByText(/generating/i)).toBeHidden({ timeout: 15000 }).catch(() => {
      // Ignore if not found - suggestions may have already completed
    });

    // Step 5: Fill in required fields (may overwrite AI suggestions)
    await page.getByLabel(/title/i).fill(TEST_TITLE);
    await page.getByLabel(/subject/i).fill(TEST_SUBJECT);

    // Step 6: Verify the submit button is enabled
    const submitButton = page.getByRole('button', { name: 'Get Feedback', exact: true });

    await expect(submitButton).toBeEnabled({ timeout: 10000 });

    // Step 6: Submit the essay
    await submitButton.click();

    // Step 7: Wait for redirect to grades page
    await expect(page).toHaveURL(/\/grades\//, { timeout: 30000 });

    // Step 8: Wait for grade to complete
    // Mock grading is fast - might skip "processing" state entirely
    await expect(page.getByTestId('grade-results')).toBeVisible({ timeout: 30000 });

    // Step 9: Verify grade results are displayed (use first() to avoid strict mode violations)
    await expect(page.getByText(/strengths/i).first()).toBeVisible();
    await expect(page.getByText(/areas for improvement/i).first()).toBeVisible();
    await expect(page.getByText(/language tips/i).first()).toBeVisible();
  });
});
