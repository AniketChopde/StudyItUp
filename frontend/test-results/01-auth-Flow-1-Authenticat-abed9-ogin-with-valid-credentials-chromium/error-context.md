# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 01-auth.spec.ts >> Flow 1: Authentication >> 1.4 — Login with valid credentials
- Location: tests\01-auth.spec.ts:36:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByPlaceholder('you@example.com')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - img "StudyItUp" [ref=e7]
        - heading "StudyItUp" [level=1] [ref=e8]
      - button [ref=e9] [cursor=pointer]:
        - img [ref=e10]
    - navigation [ref=e13]:
      - link "Dashboard" [ref=e14] [cursor=pointer]:
        - /url: /dashboard
        - img [ref=e15]
        - generic [ref=e18]: Dashboard
      - link "Study Plans" [ref=e19] [cursor=pointer]:
        - /url: /study-plans
        - img [ref=e20]
        - generic [ref=e23]: Study Plans
      - link "Learning Chat" [ref=e24] [cursor=pointer]:
        - /url: /chat
        - img [ref=e25]
        - generic [ref=e27]: Learning Chat
      - link "Take Quiz" [ref=e28] [cursor=pointer]:
        - /url: /quiz
        - img [ref=e29]
        - generic [ref=e32]: Take Quiz
      - link "View Analytics" [ref=e33] [cursor=pointer]:
        - /url: /analytics
        - img [ref=e34]
        - generic [ref=e35]: View Analytics
      - link "3D Visualize" [ref=e36] [cursor=pointer]:
        - /url: /visualize
        - img [ref=e37]
        - generic [ref=e40]: 3D Visualize
      - link "My Animations" [ref=e41] [cursor=pointer]:
        - /url: /my-animations
        - img [ref=e42]
        - generic [ref=e45]: My Animations
      - link "Test Center" [ref=e46] [cursor=pointer]:
        - /url: /test-center
        - img [ref=e47]
        - generic [ref=e50]: Test Center
      - link "Settings" [ref=e51] [cursor=pointer]:
        - /url: /settings
        - img [ref=e52]
        - generic [ref=e55]: Settings
    - button "Logout" [ref=e57] [cursor=pointer]:
      - img [ref=e58]
      - generic [ref=e61]: Logout
  - generic [ref=e62]:
    - banner [ref=e63]:
      - generic [ref=e64]:
        - generic [ref=e65]:
          - paragraph [ref=e66]: Playwright Tester
          - paragraph [ref=e67]: pw_1779162154411_zfiep@test.com
        - generic [ref=e68]: P
    - main [ref=e69]:
      - generic [ref=e71]:
        - generic [ref=e72]:
          - generic:
            - img
          - generic [ref=e73]:
            - generic [ref=e74]:
              - generic [ref=e75]:
                - img [ref=e76]
                - generic [ref=e80]: Today's Academic Objective
              - generic [ref=e81]:
                - heading "Welcome, Playwright Tester" [level=1] [ref=e82]
                - paragraph [ref=e83]: Curriculum complete. You may review existing materials or initialize a new study trajectory.
              - generic [ref=e84]:
                - link "Initialize New Plan" [ref=e85] [cursor=pointer]:
                  - /url: /study-plans/create
                  - button "Initialize New Plan" [ref=e86]
                - link "Consult AI Assistant" [ref=e87] [cursor=pointer]:
                  - /url: /chat
                  - button "Consult AI Assistant" [ref=e88]
            - generic [ref=e90]:
              - generic [ref=e91]:
                - img [ref=e92]
                - paragraph [ref=e95]: 0h
                - paragraph [ref=e96]: Total Study Time
              - generic [ref=e97]:
                - img [ref=e98]
                - paragraph [ref=e101]: "0"
                - paragraph [ref=e102]: Modules Mastered
              - generic [ref=e104]:
                - paragraph [ref=e105]: Curriculum Coverage
                - paragraph [ref=e106]: 0%
        - generic [ref=e108]:
          - generic [ref=e109]:
            - generic [ref=e110]:
              - generic [ref=e112]:
                - generic [ref=e113]:
                  - img [ref=e115]
                  - heading "Areas for Improvement" [level=3] [ref=e117]
                - generic [ref=e119]:
                  - img [ref=e121]
                  - paragraph [ref=e124]: No weak areas identified yet.
              - generic [ref=e126]:
                - generic [ref=e127]:
                  - img [ref=e129]
                  - heading "Academic Analytics" [level=3] [ref=e132]
                - generic [ref=e133]:
                  - generic [ref=e134]:
                    - img [ref=e135]
                    - generic [ref=e138]:
                      - generic [ref=e139]: 0%
                      - generic [ref=e140]: Average
                  - paragraph [ref=e141]: Based on your last 0 quizzes
            - generic [ref=e143]:
              - heading "Your Study Plans" [level=2] [ref=e144]
              - link "View All" [ref=e145] [cursor=pointer]:
                - /url: /study-plans
          - generic [ref=e146]:
            - generic [ref=e148]:
              - heading "Quick Toolbox" [level=3] [ref=e149]
              - generic [ref=e150]:
                - link "Chat" [ref=e151] [cursor=pointer]:
                  - /url: /chat
                  - img [ref=e152]
                  - generic [ref=e154]: Chat
                - link "Quiz" [ref=e155] [cursor=pointer]:
                  - /url: /quiz
                  - img [ref=e156]
                  - generic [ref=e159]: Quiz
                - link "Stats" [ref=e160] [cursor=pointer]:
                  - /url: /analytics
                  - img [ref=e161]
                  - generic [ref=e163]: Stats
                - link "New Plan" [ref=e164] [cursor=pointer]:
                  - /url: /study-plans/create
                  - img [ref=e165]
                  - generic [ref=e169]: New Plan
            - generic [ref=e171]:
              - heading "Active Reminders" [level=3] [ref=e173]
              - generic [ref=e176]:
                - paragraph [ref=e177]: No active plans yet!
                - paragraph [ref=e178]: Create a study plan to start receiving personalized reminders and tracking your progress.
                - link "Create Now" [ref=e179] [cursor=pointer]:
                  - /url: /study-plans/create
                  - button "Create Now" [ref=e180]
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
  24 |   await page.waitForURL('**/dashboard', { timeout: 15000 });
  25 | 
  26 |   // Return credentials so tests that need to re-login can use them
  27 |   return { email: uniqueEmail, password: TEST_PASSWORD, name: userName };
  28 | }
  29 | 
  30 | /** Login with specific credentials */
  31 | export async function login(page: Page, email: string, password: string = TEST_PASSWORD) {
  32 |   await page.goto('/login');
> 33 |   await page.getByPlaceholder('you@example.com').fill(email);
     |                                                  ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  34 |   await page.locator('input[placeholder="••••••••"]').fill(password);
  35 |   await page.getByRole('button', { name: 'Sign In' }).click();
  36 |   await page.waitForURL('**/dashboard', { timeout: 15000 });
  37 | }
  38 | 
```