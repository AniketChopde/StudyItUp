# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 05-settings.spec.ts >> Flow 5: Settings & Profile >> 5.2 — Profile form has all sections
- Location: tests\05-settings.spec.ts:20:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Education & Background')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Education & Background')

```

```yaml
- complementary:
  - img "StudyItUp"
  - heading "StudyItUp" [level=1]
  - button:
    - img
  - navigation:
    - link "Dashboard":
      - /url: /dashboard
      - img
      - text: Dashboard
    - link "Study Plans":
      - /url: /study-plans
      - img
      - text: Study Plans
    - link "Learning Chat":
      - /url: /chat
      - img
      - text: Learning Chat
    - link "Take Quiz":
      - /url: /quiz
      - img
      - text: Take Quiz
    - link "View Analytics":
      - /url: /analytics
      - img
      - text: View Analytics
    - link "3D Visualize":
      - /url: /visualize
      - img
      - text: 3D Visualize
    - link "My Animations":
      - /url: /my-animations
      - img
      - text: My Animations
    - link "Test Center":
      - /url: /test-center
      - img
      - text: Test Center
    - link "Settings":
      - /url: /settings
      - img
      - text: Settings
  - button "Logout":
    - img
    - text: Logout
- banner:
  - paragraph: Playwright Tester
  - paragraph: pw_1779162321895_a6nz5@test.com
  - text: P
- main:
  - text: PT
  - heading "Profile" [level=1]
  - paragraph: Customize your profile to help our AI generate perfectly tailored study plans.
  - heading "Personal Details" [level=3]:
    - img
    - text: Personal Details
  - paragraph: Your basic account information.
  - text: Email Address (Read-only)
  - textbox [disabled]: pw_1779162321895_a6nz5@test.com
  - text: Full Name
  - textbox "e.g. Jane Doe": Playwright Tester
  - heading "Educational Background" [level=3]:
    - img
    - text: Educational Background
  - paragraph: Tell the AI about your current education level so it can calibrate the difficulty of your plans.
  - text: Education Level
  - combobox:
    - option "Select Level..." [selected]
    - option "High School"
    - option "Undergraduate (College/University)"
    - option "Graduate (Master's/PhD)"
    - option "Professional / Working Adult"
  - text: Major / Field of Study
  - textbox "e.g. Computer Science, Mechanical Engineering"
  - heading "Professional & Schedule" [level=3]:
    - img
    - text: Professional & Schedule
  - paragraph: Tell the AI about your work and availability so it can schedule realistically.
  - text: Current Occupation / Role
  - textbox "e.g. Software Engineer, Medical Student, Unemployed"
  - text: Preferred Study Time
  - combobox:
    - option "Select Time..." [selected]
    - option "Morning (5AM - 11AM)"
    - option "Afternoon (11AM - 5PM)"
    - option "Evening (5PM - 9PM)"
    - option "Night Owl (9PM onwards)"
    - option "Weekends Only"
  - heading "Learning Preferences" [level=3]:
    - img
    - text: Learning Preferences
  - paragraph: How do you prefer to learn?
  - text: Preferred Learning Style
  - combobox:
    - option "Select Style..." [selected]
    - option "Visual (Diagrams, Videos, Charts)"
    - option "Auditory (Lectures, Discussions)"
    - option "Reading/Writing (Textbooks, Notes, Essays)"
    - option "Kinesthetic (Hands-on, Practice, Labs)"
  - text: Learning Pace
  - combobox:
    - option "Select Pace..." [selected]
    - option "Relaxed (I want to take my time)"
    - option "Moderate (Standard pacing)"
    - option "Intensive (Bootcamp style, fast-paced)"
  - text: Target Skills / Interests
  - textbox "e.g. Python, UI Design, Data Science, Public Speaking"
  - paragraph: Comma-separated skills you wish to acquire.
  - text: Primary Learning Goals
  - textbox "What are you trying to achieve? (e.g. I want to transition into software engineering, or I am preparing for medical school entrance exams)."
  - button "Save Profile":
    - img
    - text: Save Profile
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { registerAndLogin } from './helpers';
  3  | 
  4  | /**
  5  |  * Flow 5 — Settings & Profile
  6  |  * Form fields, edit, save, avatar initials
  7  |  */
  8  | test.describe('Flow 5: Settings & Profile', () => {
  9  | 
  10 |   test.beforeEach(async ({ page }) => {
  11 |     await registerAndLogin(page);
  12 |   });
  13 | 
  14 |   test('5.1 — Settings page renders with profile header', async ({ page }) => {
  15 |     await page.goto('/settings');
  16 |     await expect(page.getByText('Profile')).toBeVisible();
  17 |     await expect(page.getByText('Customize your profile')).toBeVisible();
  18 |   });
  19 | 
  20 |   test('5.2 — Profile form has all sections', async ({ page }) => {
  21 |     await page.goto('/settings');
  22 |     await expect(page.getByText('Full Name')).toBeVisible();
> 23 |     await expect(page.getByText('Education & Background')).toBeVisible();
     |                                                            ^ Error: expect(locator).toBeVisible() failed
  24 |     await expect(page.getByText('Learning Preferences')).toBeVisible();
  25 |     await expect(page.getByRole('button', { name: /Save/i })).toBeVisible();
  26 |   });
  27 | 
  28 |   test('5.3 — Edit profile name', async ({ page }) => {
  29 |     await page.goto('/settings');
  30 |     const nameInput = page.locator('input[name="full_name"]');
  31 |     await nameInput.clear();
  32 |     await nameInput.fill('Updated Test User');
  33 |     await expect(nameInput).toHaveValue('Updated Test User');
  34 |   });
  35 | 
  36 |   test('5.4 — Select education level', async ({ page }) => {
  37 |     await page.goto('/settings');
  38 |     const educationSelect = page.locator('select[name="education_level"]');
  39 |     if (await educationSelect.isVisible()) {
  40 |       await educationSelect.selectOption({ index: 1 });
  41 |       const selectedValue = await educationSelect.inputValue();
  42 |       expect(selectedValue).toBeTruthy();
  43 |     }
  44 |   });
  45 | 
  46 |   test('5.5 — Select learning style', async ({ page }) => {
  47 |     await page.goto('/settings');
  48 |     const styleSelect = page.locator('select[name="learning_style"]');
  49 |     if (await styleSelect.isVisible()) {
  50 |       await styleSelect.selectOption({ index: 1 });
  51 |       const selectedValue = await styleSelect.inputValue();
  52 |       expect(selectedValue).toBeTruthy();
  53 |     }
  54 |   });
  55 | 
  56 |   test('5.6 — Save profile changes', async ({ page }) => {
  57 |     await page.goto('/settings');
  58 |     const nameInput = page.locator('input[name="full_name"]');
  59 |     await nameInput.clear();
  60 |     await nameInput.fill('E2E Tested User');
  61 |     await page.getByRole('button', { name: /Save/i }).click();
  62 |     await expect(
  63 |       page.locator('[role="status"]').or(page.getByText(/success|saved|updated/i))
  64 |     ).toBeVisible({ timeout: 10000 });
  65 |   });
  66 | 
  67 |   test('5.7 — Avatar shows correct initials', async ({ page }) => {
  68 |     await page.goto('/settings');
  69 |     const avatar = page.locator('.rounded-full.bg-primary').first();
  70 |     await expect(avatar).toBeVisible();
  71 |     const initials = await avatar.textContent();
  72 |     expect(initials).toBeTruthy();
  73 |     expect(initials!.length).toBeLessThanOrEqual(2);
  74 |   });
  75 | });
  76 | 
```