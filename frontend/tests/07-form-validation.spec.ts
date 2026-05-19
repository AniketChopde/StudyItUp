import { test, expect } from '@playwright/test';

/**
 * Flow 7 — Form Validation
 * Client-side validation for Register and Login forms
 */
test.describe('Flow 7: Form Validation', () => {

  test('7.1 — Register: empty form shows errors', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page.locator('.text-destructive').first()).toBeVisible({ timeout: 5000 });
  });

  test('7.2 — Register: password mismatch', async ({ page }) => {
    await page.goto('/register');
    await page.getByPlaceholder('you@example.com').fill('test@test.com');
    await page.locator('input[placeholder="••••••••"]').first().fill('Password123!');
    await page.locator('input[placeholder="••••••••"]').nth(1).fill('DifferentPassword!');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page.getByText("Passwords don't match")).toBeVisible({ timeout: 5000 });
  });

  test('7.3 — Register: short password', async ({ page }) => {
    await page.goto('/register');
    await page.getByPlaceholder('you@example.com').fill('test@test.com');
    await page.locator('input[placeholder="••••••••"]').first().fill('short');
    await page.locator('input[placeholder="••••••••"]').nth(1).fill('short');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page.getByText(/at least 8 characters/)).toBeVisible({ timeout: 5000 });
  });

  test('7.4 — Login: empty form shows errors', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.locator('.text-destructive').first()).toBeVisible({ timeout: 5000 });
  });

  test('7.5 — Login: invalid email format', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill('not-an-email');
    await page.locator('input[placeholder="••••••••"]').fill('SomePassword!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText(/Invalid email/)).toBeVisible({ timeout: 5000 });
  });
});
