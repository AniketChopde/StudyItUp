import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers';

/**
 * Flow 9 — UI Smoke Tests
 * Sidebar toggle, page renders, 404 handling
 */
test.describe('Flow 9: UI Smoke Tests', () => {

  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
  });

  test('9.1 — Sidebar collapse/expand toggle', async ({ page }) => {
    const sidebar = page.locator('aside');
    if (await sidebar.isVisible()) {
      const toggleBtn = sidebar.locator('button').first();
      const initialWidth = await sidebar.evaluate(el => el.getBoundingClientRect().width);
      await toggleBtn.click();
      await page.waitForTimeout(500);
      const newWidth = await sidebar.evaluate(el => el.getBoundingClientRect().width);
      expect(newWidth).not.toEqual(initialWidth);
    }
  });

  test('9.2 — Quiz page renders', async ({ page }) => {
    await page.goto('/quiz');
    await expect(page.locator('main')).toBeVisible();
  });

  test('9.3 — Analytics page renders', async ({ page }) => {
    await page.goto('/analytics');
    await expect(page.locator('main')).toBeVisible();
  });

  test('9.4 — Test Center page renders', async ({ page }) => {
    await page.goto('/test-center');
    await expect(page.locator('main')).toBeVisible();
  });

  test('9.5 — Unknown route redirects to dashboard or login', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    await expect(page).toHaveURL(/\/(dashboard|login)/);
  });
});
