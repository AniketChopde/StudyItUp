# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 05-settings.spec.ts >> Flow 5: Settings & Profile >> 5.1 — Settings page renders with profile header
- Location: tests\05-settings.spec.ts:14:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Profile')
Expected: visible
Error: strict mode violation: getByText('Profile') resolved to 3 elements:
    1) <h1 class="text-3xl font-black tracking-tight uppercase">Profile</h1> aka getByRole('heading', { name: 'Profile' })
    2) <p class="text-muted-foreground mt-1 font-medium">Customize your profile to help our AI generate pe…</p> aka getByText('Customize your profile to')
    3) <button type="submit" class="justify-center text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-11 rounded-xl px-4 font-black tracking-wider uppercase shadow-xl shadow-primary/20 flex items-center gap-2">…</button> aka getByRole('button', { name: 'Save Profile' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Profile')

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
                    - paragraph [ref=e67]: pw_1779162308555_571rz@test.com
                - generic [ref=e68]: P
        - main [ref=e69]:
            - generic [ref=e71]:
                - generic [ref=e72]:
                    - generic [ref=e73]: PT
                    - generic [ref=e74]:
                        - heading "Profile" [level=1] [ref=e75]
                        - paragraph [ref=e76]: Customize your profile to help our AI generate perfectly tailored study plans.
                - generic [ref=e77]:
                    - generic [ref=e78]:
                        - generic [ref=e79]:
                            - heading "Personal Details" [level=3] [ref=e80]:
                                - img [ref=e81]
                                - text: Personal Details
                            - paragraph [ref=e84]: Your basic account information.
                        - generic [ref=e86]:
                            - generic [ref=e87]:
                                - text: Email Address (Read-only)
                                - textbox [disabled] [ref=e88]: pw_1779162308555_571rz@test.com
                            - generic [ref=e89]:
                                - text: Full Name
                                - textbox "e.g. Jane Doe" [ref=e90]: Playwright Tester
                    - generic [ref=e91]:
                        - generic [ref=e92]:
                            - heading "Educational Background" [level=3] [ref=e93]:
                                - img [ref=e94]
                                - text: Educational Background
                            - paragraph [ref=e97]: Tell the AI about your current education level so it can calibrate the difficulty of your plans.
                        - generic [ref=e99]:
                            - generic [ref=e100]:
                                - text: Education Level
                                - combobox [ref=e101]:
                                    - option "Select Level..." [selected]
                                    - option "High School"
                                    - option "Undergraduate (College/University)"
                                    - option "Graduate (Master's/PhD)"
                                    - option "Professional / Working Adult"
                            - generic [ref=e102]:
                                - text: Major / Field of Study
                                - textbox "e.g. Computer Science, Mechanical Engineering" [ref=e103]
                    - generic [ref=e104]:
                        - generic [ref=e105]:
                            - heading "Professional & Schedule" [level=3] [ref=e106]:
                                - img [ref=e107]
                                - text: Professional & Schedule
                            - paragraph [ref=e110]: Tell the AI about your work and availability so it can schedule realistically.
                        - generic [ref=e112]:
                            - generic [ref=e113]:
                                - text: Current Occupation / Role
                                - textbox "e.g. Software Engineer, Medical Student, Unemployed" [ref=e114]
                            - generic [ref=e115]:
                                - text: Preferred Study Time
                                - combobox [ref=e116]:
                                    - option "Select Time..." [selected]
                                    - option "Morning (5AM - 11AM)"
                                    - option "Afternoon (11AM - 5PM)"
                                    - option "Evening (5PM - 9PM)"
                                    - option "Night Owl (9PM onwards)"
                                    - option "Weekends Only"
                    - generic [ref=e117]:
                        - generic [ref=e118]:
                            - heading "Learning Preferences" [level=3] [ref=e119]:
                                - img [ref=e120]
                                - text: Learning Preferences
                            - paragraph [ref=e123]: How do you prefer to learn?
                        - generic [ref=e124]:
                            - generic [ref=e125]:
                                - text: Preferred Learning Style
                                - combobox [ref=e126]:
                                    - option "Select Style..." [selected]
                                    - option "Visual (Diagrams, Videos, Charts)"
                                    - option "Auditory (Lectures, Discussions)"
                                    - option "Reading/Writing (Textbooks, Notes, Essays)"
                                    - option "Kinesthetic (Hands-on, Practice, Labs)"
                            - generic [ref=e127]:
                                - text: Learning Pace
                                - combobox [ref=e128]:
                                    - option "Select Pace..." [selected]
                                    - option "Relaxed (I want to take my time)"
                                    - option "Moderate (Standard pacing)"
                                    - option "Intensive (Bootcamp style, fast-paced)"
                            - generic [ref=e129]:
                                - text: Target Skills / Interests
                                - textbox "e.g. Python, UI Design, Data Science, Public Speaking" [ref=e130]
                                - paragraph [ref=e131]: Comma-separated skills you wish to acquire.
                            - generic [ref=e132]:
                                - text: Primary Learning Goals
                                - textbox "What are you trying to achieve? (e.g. I want to transition into software engineering, or I am preparing for medical school entrance exams)." [ref=e133]
                    - button "Save Profile" [ref=e135] [cursor=pointer]:
                        - img [ref=e136]
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
> 16 |     await expect(page.getByText('Profile')).toBeVisible();
     |                                             ^ Error: expect(locator).toBeVisible() failed
  17 |     await expect(page.getByText('Customize your profile')).toBeVisible();
  18 |   });
  19 |
  20 |   test('5.2 — Profile form has all sections', async ({ page }) => {
  21 |     await page.goto('/settings');
  22 |     await expect(page.getByText('Full Name')).toBeVisible();
  23 |     await expect(page.getByText('Education & Background')).toBeVisible();
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
