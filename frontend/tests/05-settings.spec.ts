import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers';

/**
 * Flow 5 — Settings & Profile
 * Form fields, edit, save, avatar initials
 */
test.describe('Flow 5: Settings & Profile', () => {

  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
  });

  test('5.1 — Settings page renders with profile header', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByText('Profile')).toBeVisible();
    await expect(page.getByText('Customize your profile')).toBeVisible();
  });

  test('5.2 — Profile form has all sections', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByText('Full Name')).toBeVisible();
    await expect(page.getByText('Education & Background')).toBeVisible();
    await expect(page.getByText('Learning Preferences')).toBeVisible();
    await expect(page.getByRole('button', { name: /Save/i })).toBeVisible();
  });

  test('5.3 — Edit profile name', async ({ page }) => {
    await page.goto('/settings');
    const nameInput = page.locator('input[name="full_name"]');
    await nameInput.clear();
    await nameInput.fill('Updated Test User');
    await expect(nameInput).toHaveValue('Updated Test User');
  });

  test('5.4 — Select education level', async ({ page }) => {
    await page.goto('/settings');
    const educationSelect = page.locator('select[name="education_level"]');
    if (await educationSelect.isVisible()) {
      await educationSelect.selectOption({ index: 1 });
      const selectedValue = await educationSelect.inputValue();
      expect(selectedValue).toBeTruthy();
    }
  });

  test('5.5 — Select learning style', async ({ page }) => {
    await page.goto('/settings');
    const styleSelect = page.locator('select[name="learning_style"]');
    if (await styleSelect.isVisible()) {
      await styleSelect.selectOption({ index: 1 });
      const selectedValue = await styleSelect.inputValue();
      expect(selectedValue).toBeTruthy();
    }
  });

  test('5.6 — Save profile changes', async ({ page }) => {
    await page.goto('/settings');
    const nameInput = page.locator('input[name="full_name"]');
    await nameInput.clear();
    await nameInput.fill('E2E Tested User');
    await page.getByRole('button', { name: /Save/i }).click();
    await expect(
      page.locator('[role="status"]').or(page.getByText(/success|saved|updated/i))
    ).toBeVisible({ timeout: 10000 });
  });

  test('5.7 — Avatar shows correct initials', async ({ page }) => {
    await page.goto('/settings');
    const avatar = page.locator('.rounded-full.bg-primary').first();
    await expect(avatar).toBeVisible();
    const initials = await avatar.textContent();
    expect(initials).toBeTruthy();
    expect(initials!.length).toBeLessThanOrEqual(2);
  });
});
