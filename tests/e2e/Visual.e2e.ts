import percySnapshot from '@percy/playwright';
import { expect, test } from '@playwright/test';

test.describe('Visual testing', () => {
  test.describe('Static pages', () => {
    test('should take screenshot of the homepage', async ({ page }) => {
      await page.goto('/');

      await expect(page.getByRole('heading', { name: 'Get Your Essay Graded by AI' })).toBeVisible();

      await percySnapshot(page, 'Homepage');
    });

    test('should take screenshot of the French homepage', async ({ page }) => {
      await page.goto('/fr');

      await expect(page.getByRole('heading', { name: /corriger votre essai par IA/i })).toBeVisible();

      await percySnapshot(page, 'Homepage - French');
    });
  });
});
