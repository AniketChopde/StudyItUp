import { test, expect, Page } from '@playwright/test';

/**
 * Shared helpers and test credentials for all NexusLearn E2E tests.
 *
 * IMPORTANT: Each call to registerAndLogin() creates a UNIQUE user
 * so tests never collide with each other.
 */

export const TEST_PASSWORD = 'Test@1234!';

/** Register a fresh account with a unique email and land on /dashboard */
export async function registerAndLogin(page: Page) {
  // Generate a unique email for EVERY call
  const uniqueEmail = `pw_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@test.com`;
  const userName = 'Playwright Tester';

  await page.goto('/register');
  await page.getByPlaceholder('John Doe').fill(userName);
  await page.getByPlaceholder('you@example.com').fill(uniqueEmail);
  await page.locator('input[placeholder="••••••••"]').first().fill(TEST_PASSWORD);
  await page.locator('input[placeholder="••••••••"]').nth(1).fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Create Account' }).click();
  await page.waitForURL('**/dashboard', { timeout: 15000 });

  // Return credentials so tests that need to re-login can use them
  return { email: uniqueEmail, password: TEST_PASSWORD, name: userName };
}

/** Login with specific credentials */
export async function login(page: Page, email: string, password: string = TEST_PASSWORD) {
  await page.goto('/login');
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.locator('input[placeholder="••••••••"]').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('**/dashboard', { timeout: 15000 });
}
