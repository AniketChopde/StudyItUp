import { test, expect } from '@playwright/test';
import { registerAndLogin, login, TEST_PASSWORD } from './helpers';

/**
 * Flow 1 — Authentication
 * Register, Login, Error handling, Page navigation
 */
test.describe('Flow 1: Authentication', () => {

  test('1.1 — Register page renders correctly', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
    await expect(page.getByText('Start your learning journey')).toBeVisible();
    await expect(page.getByPlaceholder('John Doe')).toBeVisible();
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
    await expect(page.getByText('Already have an account?')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
  });

  test('1.2 — Register a new user', async ({ page }) => {
    await registerAndLogin(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('1.3 — Login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    await expect(page.getByText('Sign in to your StudyItUp account')).toBeVisible();
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Forgot password?' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();
  });

  test('1.4 — Login with valid credentials', async ({ page }) => {
    // First register → get the unique credentials back
    const creds = await registerAndLogin(page);

    // Logout by clearing tokens
    await page.evaluate(() => {
      localStorage.removeItem('access_token');
      sessionStorage.removeItem('access_token');
    });

    // Now re-login with the SAME credentials
    await login(page, creds.email, creds.password);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('1.5 — Login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill('nonexistent@fake.com');
    await page.locator('input[placeholder="••••••••"]').fill('WrongPassword!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.locator('.text-destructive').first()).toBeVisible({ timeout: 10000 });
  });

  test('1.6 — Navigate from Login → Register', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'Sign up' }).click();
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
  });

  test('1.7 — Navigate from Register → Login', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('link', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
  });

  test('1.8 — Forgot password link works', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'Forgot password?' }).click();
    await expect(page).toHaveURL(/\/forgot-password/);
  });
});
