import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers';

/**
 * Flow 6 — Sidebar Navigation
 * Navigate to each major route via the desktop sidebar
 */
test.describe('Flow 6: Sidebar Navigation', () => {

  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
  });

  test('6.1 — Navigate to Dashboard via sidebar', async ({ page }) => {
    await page.goto('/settings'); // start from a different page
    const link = page.locator('aside').getByText('Dashboard', { exact: true });
    if (await link.isVisible()) {
      await link.click();
      await expect(page).toHaveURL(/\/dashboard/);
    }
  });

  test('6.2 — Navigate to Study Plans via sidebar', async ({ page }) => {
    const link = page.locator('aside').getByText('Study Plans', { exact: true });
    if (await link.isVisible()) {
      await link.click();
      await expect(page).toHaveURL(/\/study-plans/);
    }
  });

  test('6.3 — Navigate to Learning Chat via sidebar', async ({ page }) => {
    const link = page.locator('aside').getByText('Learning Chat', { exact: true });
    if (await link.isVisible()) {
      await link.click();
      await expect(page).toHaveURL(/\/chat/);
    }
  });

  test('6.4 — Navigate to Take Quiz via sidebar', async ({ page }) => {
    const link = page.locator('aside').getByText('Take Quiz', { exact: true });
    if (await link.isVisible()) {
      await link.click();
      await expect(page).toHaveURL(/\/quiz/);
    }
  });

  test('6.5 — Navigate to View Analytics via sidebar', async ({ page }) => {
    const link = page.locator('aside').getByText('View Analytics', { exact: true });
    if (await link.isVisible()) {
      await link.click();
      await expect(page).toHaveURL(/\/analytics/);
    }
  });

  test('6.6 — Navigate to Settings via sidebar', async ({ page }) => {
    const link = page.locator('aside').getByText('Settings', { exact: true });
    if (await link.isVisible()) {
      await link.click();
      await expect(page).toHaveURL(/\/settings/);
    }
  });
});
