import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers';

/**
 * Flow 8 — Protected Routes & Auth Guards
 * Unauthenticated redirects + authenticated public-route redirects
 */
test.describe('Flow 8: Protected Routes', () => {

  test('8.1 — /dashboard redirects to /login when unauthenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('8.2 — /study-plans redirects to /login when unauthenticated', async ({ page }) => {
    await page.goto('/study-plans');
    await expect(page).toHaveURL(/\/login/);
  });

  test('8.3 — /chat redirects to /login when unauthenticated', async ({ page }) => {
    await page.goto('/chat');
    await expect(page).toHaveURL(/\/login/);
  });

  test('8.4 — /settings redirects to /login when unauthenticated', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/login/);
  });

  test('8.5 — /analytics redirects to /login when unauthenticated', async ({ page }) => {
    await page.goto('/analytics');
    await expect(page).toHaveURL(/\/login/);
  });

  test('8.6 — / redirects to /login when unauthenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('8.7 — /login redirects to /dashboard when authenticated', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto('/login');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('8.8 — /register redirects to /dashboard when authenticated', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto('/register');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
