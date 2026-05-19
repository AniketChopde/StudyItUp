# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 04-chat.spec.ts >> Flow 4: Learning Chat >> 4.1 — Chat page renders with welcome message
- Location: tests\04-chat.spec.ts:14:3

# Error details

```
TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/dashboard" until "load"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - generic [ref=e6]:
      - img "StudyItUp" [ref=e7]
      - generic [ref=e8]: StudyItUp
    - heading "Create Account" [level=3] [ref=e9]
    - paragraph [ref=e10]: Start your learning journey with StudyItUp
  - generic [ref=e12]:
    - generic [ref=e13]:
      - generic [ref=e14]: Full Name (Optional)
      - textbox "John Doe" [ref=e16]: Playwright Tester
    - generic [ref=e17]:
      - generic [ref=e18]: Email
      - textbox "you@example.com" [ref=e20]: pw_1779162264781_mqj4q@test.com
    - generic [ref=e21]:
      - generic [ref=e22]: Password
      - generic [ref=e23]:
        - textbox "••••••••" [ref=e24]: Test@1234!
        - button "Show password" [ref=e25] [cursor=pointer]:
          - img [ref=e26]
          - generic [ref=e29]: Show password
    - generic [ref=e30]:
      - generic [ref=e31]: Confirm Password
      - generic [ref=e32]:
        - textbox "••••••••" [ref=e33]: Test@1234!
        - button "Show password" [ref=e34] [cursor=pointer]:
          - img [ref=e35]
          - generic [ref=e38]: Show password
    - generic [ref=e39]:
      - img [ref=e40]
      - generic [ref=e42]: Registration failed
    - button "Create Account" [ref=e43] [cursor=pointer]
    - generic [ref=e44]:
      - generic [ref=e46]: or sign up with
      - generic [ref=e48]:
        - button "Sign up with Google. Opens in new tab" [ref=e50] [cursor=pointer]:
          - generic [ref=e52]:
            - img [ref=e55]
            - generic [ref=e62]: Sign up with Google
        - iframe
  - paragraph [ref=e64]:
    - text: Already have an account?
    - link "Sign in" [ref=e65] [cursor=pointer]:
      - /url: /login
```

# Test source

```ts
  1  | import { test, expect, Page } from '@playwright/test';
  2  | 
  3  | /**
  4  |  * Shared helpers and test credentials for all NexusLearn E2E tests.
  5  |  *
  6  |  * IMPORTANT: Each call to registerAndLogin() creates a UNIQUE user
  7  |  * so tests never collide with each other.
  8  |  */
  9  | 
  10 | export const TEST_PASSWORD = 'Test@1234!';
  11 | 
  12 | /** Register a fresh account with a unique email and land on /dashboard */
  13 | export async function registerAndLogin(page: Page) {
  14 |   // Generate a unique email for EVERY call
  15 |   const uniqueEmail = `pw_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@test.com`;
  16 |   const userName = 'Playwright Tester';
  17 | 
  18 |   await page.goto('/register');
  19 |   await page.getByPlaceholder('John Doe').fill(userName);
  20 |   await page.getByPlaceholder('you@example.com').fill(uniqueEmail);
  21 |   await page.locator('input[placeholder="••••••••"]').first().fill(TEST_PASSWORD);
  22 |   await page.locator('input[placeholder="••••••••"]').nth(1).fill(TEST_PASSWORD);
  23 |   await page.getByRole('button', { name: 'Create Account' }).click();
> 24 |   await page.waitForURL('**/dashboard', { timeout: 15000 });
     |              ^ TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
  25 | 
  26 |   // Return credentials so tests that need to re-login can use them
  27 |   return { email: uniqueEmail, password: TEST_PASSWORD, name: userName };
  28 | }
  29 | 
  30 | /** Login with specific credentials */
  31 | export async function login(page: Page, email: string, password: string = TEST_PASSWORD) {
  32 |   await page.goto('/login');
  33 |   await page.getByPlaceholder('you@example.com').fill(email);
  34 |   await page.locator('input[placeholder="••••••••"]').fill(password);
  35 |   await page.getByRole('button', { name: 'Sign In' }).click();
  36 |   await page.waitForURL('**/dashboard', { timeout: 15000 });
  37 | }
  38 | 
```