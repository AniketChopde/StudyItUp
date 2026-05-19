import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers';

/**
 * Flow 4 — Learning Chat
 * Renders, input states, send message, receive AI response
 */
test.describe('Flow 4: Learning Chat', () => {

  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
  });

  test('4.1 — Chat page renders with welcome message', async ({ page }) => {
    await page.goto('/chat');
    await expect(page.getByText('Learning Copilot')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Welcome to NexusLearn|How can I help/)).toBeVisible({ timeout: 10000 });
  });

  test('4.2 — Chat input area is visible and editable', async ({ page }) => {
    await page.goto('/chat');
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
    await textarea.fill('Hello, can you help me study?');
    await expect(textarea).toHaveValue('Hello, can you help me study?');
  });

  test('4.3 — Send button is disabled when input is empty', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForTimeout(1000);
    const sendButton = page.locator('button').filter({ has: page.locator('svg.lucide-send') });
    await expect(sendButton).toBeDisabled();
  });

  test('4.4 — Send button is enabled when input has text', async ({ page }) => {
    await page.goto('/chat');
    const textarea = page.locator('textarea');
    await textarea.fill('Test message');
    const sendButton = page.locator('button').filter({ has: page.locator('svg.lucide-send') });
    await expect(sendButton).toBeEnabled();
  });

  test('4.5 — Send a message and see it appear', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/chat');
    await page.waitForTimeout(2000);
    const textarea = page.locator('textarea');
    await textarea.fill('What is machine learning?');
    const sendButton = page.locator('button').filter({ has: page.locator('svg.lucide-send') });
    await sendButton.click();
    await expect(page.getByText('What is machine learning?')).toBeVisible({ timeout: 10000 });
  });
});
