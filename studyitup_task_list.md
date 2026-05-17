# StudyItUp Finalization Task List

## 1. Core Study Plan UX & Design
- [ ] **Study Plan Detail Page Enhancement**
    - [ ] Add Start Date and End Date display.
    - [ ] Add Total Estimated Time needed.
    - [ ] Implement Chapter-wise progress indicators.
    - [ ] Add "Regenerate my plan" and "Need a detailed plan" functionality.
    - [ ] Improve "Edit Plan" modal to update existing plan correctly.
- [ ] **Dashboard Cleanup**
    - [ ] Show "Today's Study Task" prominently.
    - [ ] Add "Weak Areas" based on quiz performance.
    - [ ] Add "Next Reminder".
    - [ ] Remove all gamification artifacts (points, levels, streaks).
- [ ] **UI Polish**
    - [ ] Hide sidebar on specific pages (like Quiz or deep study) if needed.
    - [ ] Replace/Optimize position and size of "Complete" and "Start Plan" buttons.
    - [ ] Improve prep screen / window for lessons.
    - [ ] Implement clear click states for all interactive elements.

## 2. Study Session & Logic
- [ ] **Quiz Personalization**
    - [ ] Differentiate quizzes by level (Easy, Medium, Hard).
    - [ ] Provide breakdown of weak areas after quiz completion.
    - [ ] Add "Retake Quiz" button.
- [ ] **Course Structure**
    - [ ] Ensure courses are strictly chapter-wise.
    - [ ] Show roadmap from current level to goal.
    - [ ] Include certification completion progress.
- [ ] **Knowledge Reuse (Optimization)**
    - [ ] Implement logic to reuse existing study plan templates for common exam types to save API tokens and time.

## 3. Technical Fixes & Bugs
- [ ] **Completion Logic**
    - [ ] Fix Course Completion bug (ensuring state persists).
    - [ ] Fix Reminder Completion bug.
- [ ] **API & Backend**
    - [ ] Merge API completion issues.
    - [ ] Resolve calendar/feedback sync issues.
    - [ ] Fix yield/close issues in backend streamers.
- [ ] **Mobile Responsiveness**
    - [ ] Audit all pages for mobile view and fix breaking layouts.

## 4. Gamification Removal (CRITICAL)
- [ ] Remove "Awards" / "Achievements" section.
- [ ] Remove "Points" / "Experience" systems.
- [ ] Focus strictly on Academic Workspace aesthetics.

## 5. Documentation & Handoff
- [ ] Prepare final release notes.
- [ ] Ensure "AI Strategy Note" is visible and helpful.
