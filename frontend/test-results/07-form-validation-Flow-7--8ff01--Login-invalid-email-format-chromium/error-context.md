# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 07-form-validation.spec.ts >> Flow 7: Form Validation >> 7.5 — Login: invalid email format
- Location: tests\07-form-validation.spec.ts:39:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/Invalid email/)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/Invalid email/)

```

```yaml
- img "StudyItUp"
- text: StudyItUp
- heading "Welcome Back" [level=3]
- paragraph: Sign in to your StudyItUp account
- text: Email
- textbox "you@example.com": not-an-email
- text: Password
- textbox "••••••••": SomePassword!
- button "Show password"
- checkbox "Remember me"
- text: Remember me
- link "Forgot password?":
  - /url: /forgot-password
- button "Sign In"
- text: or continue with
- button "Sign in with Google. Opens in new tab":
  - img
  - text: Sign in with Google
- iframe
- paragraph:
  - text: Don't have an account?
  - link "Sign up":
    - /url: /register
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | /**
  4  |  * Flow 7 — Form Validation
  5  |  * Client-side validation for Register and Login forms
  6  |  */
  7  | test.describe('Flow 7: Form Validation', () => {
  8  | 
  9  |   test('7.1 — Register: empty form shows errors', async ({ page }) => {
  10 |     await page.goto('/register');
  11 |     await page.getByRole('button', { name: 'Create Account' }).click();
  12 |     await expect(page.locator('.text-destructive').first()).toBeVisible({ timeout: 5000 });
  13 |   });
  14 | 
  15 |   test('7.2 — Register: password mismatch', async ({ page }) => {
  16 |     await page.goto('/register');
  17 |     await page.getByPlaceholder('you@example.com').fill('test@test.com');
  18 |     await page.locator('input[placeholder="••••••••"]').first().fill('Password123!');
  19 |     await page.locator('input[placeholder="••••••••"]').nth(1).fill('DifferentPassword!');
  20 |     await page.getByRole('button', { name: 'Create Account' }).click();
  21 |     await expect(page.getByText("Passwords don't match")).toBeVisible({ timeout: 5000 });
  22 |   });
  23 | 
  24 |   test('7.3 — Register: short password', async ({ page }) => {
  25 |     await page.goto('/register');
  26 |     await page.getByPlaceholder('you@example.com').fill('test@test.com');
  27 |     await page.locator('input[placeholder="••••••••"]').first().fill('short');
  28 |     await page.locator('input[placeholder="••••••••"]').nth(1).fill('short');
  29 |     await page.getByRole('button', { name: 'Create Account' }).click();
  30 |     await expect(page.getByText(/at least 8 characters/)).toBeVisible({ timeout: 5000 });
  31 |   });
  32 | 
  33 |   test('7.4 — Login: empty form shows errors', async ({ page }) => {
  34 |     await page.goto('/login');
  35 |     await page.getByRole('button', { name: 'Sign In' }).click();
  36 |     await expect(page.locator('.text-destructive').first()).toBeVisible({ timeout: 5000 });
  37 |   });
  38 | 
  39 |   test('7.5 — Login: invalid email format', async ({ page }) => {
  40 |     await page.goto('/login');
  41 |     await page.getByPlaceholder('you@example.com').fill('not-an-email');
  42 |     await page.locator('input[placeholder="••••••••"]').fill('SomePassword!');
  43 |     await page.getByRole('button', { name: 'Sign In' }).click();
> 44 |     await expect(page.getByText(/Invalid email/)).toBeVisible({ timeout: 5000 });
     |                                                   ^ Error: expect(locator).toBeVisible() failed
  45 |   });
  46 | });
  47 | 
```