import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers';

/**
 * Flow 2 — Dashboard
 * Page load, hero section, quick-action cards
 */
test.describe('Flow 2: Dashboard', () => {

  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
  });

  test('2.1 — Dashboard loads and shows hero heading', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('2.2 — Shows "Today\'s Academic Objective" badge', async ({ page }) => {
    await expect(page.getByText("Today's Academic Objective")).toBeVisible();
  });

  test('2.3 — Main content area is rendered', async ({ page }) => {
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });
});
