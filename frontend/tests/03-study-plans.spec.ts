import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers';

/**
 * Flow 3 — Study Plans
 * Create page form, validation, Fast Learn toggle, high-hours modal
 */
test.describe('Flow 3: Study Plans', () => {

  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
  });

  test('3.1 — Navigate to Study Plans page', async ({ page }) => {
    await page.goto('/study-plans');
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('3.2 — Create Study Plan page renders form', async ({ page }) => {
    await page.goto('/study-plans/create');
    await expect(page.getByRole('heading', { name: 'Create Study Plan' })).toBeVisible();
    await expect(page.getByText('Plan Details')).toBeVisible();
    await expect(page.getByPlaceholder(/Machine Learning/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Generate/ })).toBeVisible();
  });

  test('3.3 — Empty form shows validation errors', async ({ page }) => {
    await page.goto('/study-plans/create');
    await page.getByRole('button', { name: /Generate/ }).click();
    await expect(page.locator('.text-destructive').first()).toBeVisible({ timeout: 5000 });
  });

  test('3.4 — Fill and submit Create Study Plan form', async ({ page }) => {
    test.setTimeout(120000); // AI generation can be slow
    await page.goto('/study-plans/create');
    await page.getByPlaceholder(/Machine Learning/).fill('Playwright Testing');
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 30);
    await page.locator('input[type="date"]').nth(1).fill(targetDate.toISOString().split('T')[0]);
    await page.getByRole('button', { name: /Generate/ }).click();
    await page.waitForURL(/\/(study-plans|dashboard)/, { timeout: 120000 });
  });

  test('3.5 — Fast Learn mode toggle works', async ({ page }) => {
    await page.goto('/study-plans/create');
    const checkbox = page.locator('input[type="checkbox"]');
    await checkbox.check();
    await expect(page.getByText('Enabled')).toBeVisible();
    await expect(page.getByText('Core-first topic prioritization')).toBeVisible();
  });

  test('3.6 — High hours warning modal appears (>8h)', async ({ page }) => {
    await page.goto('/study-plans/create');
    await page.getByPlaceholder(/Machine Learning/).fill('Test Plan');
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 30);
    await page.locator('input[type="date"]').nth(1).fill(targetDate.toISOString().split('T')[0]);
    const hoursInput = page.locator('input[type="number"]');
    await hoursInput.clear();
    await hoursInput.fill('10');
    await page.getByRole('button', { name: /Generate/ }).click();
    await expect(page.getByText('Intensive Schedule!')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /Committed/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Reconsider/ })).toBeVisible();
  });

  test('3.7 — Dismiss high hours warning with Reconsider', async ({ page }) => {
    await page.goto('/study-plans/create');
    await page.getByPlaceholder(/Machine Learning/).fill('Test Plan');
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 30);
    await page.locator('input[type="date"]').nth(1).fill(targetDate.toISOString().split('T')[0]);
    const hoursInput = page.locator('input[type="number"]');
    await hoursInput.clear();
    await hoursInput.fill('12');
    await page.getByRole('button', { name: /Generate/ }).click();
    await expect(page.getByText('Intensive Schedule!')).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /Reconsider/ }).click();
    await expect(page.getByText('Intensive Schedule!')).not.toBeVisible();
  });
});
