# Copilot Rules for Technically Fit

These are the persistent rules and workflow guidelines for Copilot and all contributors. Follow these for every feature, bugfix, and accessibility update:

## Task & Progress Tracking

- All completed tasks and features must be listed in PROJECT_STATUS.md as soon as they are completed. This file is the authoritative source for project status and compliance tracking.

- Always keep `technically-fit/tasks.md` and the structured todo list in sync.
- When a task is completed, mark it as done in both `tasks.md` and the todo list.
- Always move to the next unchecked task in `tasks.md` unless otherwise instructed.
- If a new feature or bugfix is started, add it to both `tasks.md` and the todo list.

## Accessibility

- For accessibility work, always:
  - Implement ARIA roles, labels, and alt text for all interactive and image elements.
  - Ensure keyboard navigation for all major flows.
  - Audit for color contrast (WCAG AA compliance).
  - Audit and improve AccessibilityUtils.svelte and +layout.svelte.
  - Audit all dashboard widgets/components for accessibility.
- Mark each accessibility subtask as complete in both `tasks.md` and the todo list as you finish it.

## General

- Do not ask for permission to proceed if the next step is clear from the rules or the current checklist.
- If a rule or workflow is updated, update this file and follow the new version.
- If in doubt, prefer explicit progress tracking and clear, accessible code.

## 📱 PLATFORM COMPLIANCE RULES: Google Play Store + Apple App Store (Health & Fitness Apps)

### Purpose:

Ensure all features are compliant with both Google Play and Apple App Store policies governing health, fitness, AI, wearable integration, and sensitive user data.

### Applies To:

Any features that:

- Handle or analyze health or fitness data (e.g. heart rate, strain, reps, sets, load)
- Interact with wearables (Apple Watch, WHOOP, Fitbit, Samsung, Polar)
- Adjust or display personalized workout/nutrition plans
- Summarize or store performance, AI config, or macro information
- Control live activity (e.g. Dynamic Island, workout overlays)
- Require user authentication or account linkage

---

### ✅ CORE COMPLIANCE REQUIREMENTS

#### 1. **Data Declaration & Transparency**

- Complete all required privacy/data declarations:
  - ✅ Google Play Console → Data Safety form
  - ✅ Apple App Store Connect → App Privacy details
- Disclose: what data is collected, how it’s used, whether it’s linked to identity, and if it’s used for tracking.

#### 2. **Privacy Policy (Public URL Required)**

Include a publicly accessible privacy policy that clearly states:

- What data is collected (e.g. workout summaries, wearable stats)
- Why it's collected and how it improves user experience
- Where it’s stored (Convex JSON-based summaries/configs)
- Data retention policy (max 3 years)
- How users can access, export, and delete their data
- Whether third parties access the data (e.g. trainers)

#### 3. **Data Retention & Storage Logic**

- Do NOT retain health or fitness data longer than 3 years.
- Use Convex JSON strings to store:
  - Monthly summaries
  - Yearly summaries
  - AI config per user
- Automatically purge oldest year of data on the **anniversary** of the user’s subscription.
- Avoid generating excess files or documents per user.

#### 4. **User Data Control**

Implement in-app options to:

- View current stored health/workout data
- Export/download all personal data (JSON or CSV)
- Permanently delete stored data upon request

#### 5. **Sensitive Data Handling**

- Never store PII (name, email, etc.) in plaintext in summaries or config files.
- Encrypt all sensitive data in transit and at rest.
- Clearly explain usage of health sensors or AI insights in privacy disclosures.

#### 6. **AI Usage Constraints**

- All AI decisions (e.g. macro adjustments, deload enforcement, fatigue scoring) must:
  - Include a disclaimer: “AI-generated guidance is not medical advice.”
  - Be explainable in the privacy policy and user agreement
  - Allow opt-out for AI-based personalization (toggle in app settings)

#### 7. **Permissions & Wearable Logic**

- Only request health/fitness-related permissions when necessary:
  - Detect if wearable (WHOOP, Apple Watch, Fitbit, Polar) is connected
  - Disable wearable-based features if no device is detected
  - Do not request background sensor access unless required by the current feature
- Disclose wearable requirement for strain-based nudges or rest tracking in store listing and privacy docs.

#### 8. **Live Activity + Music Control**

- Live Activity (iOS Dynamic Island) must:
  - Show in-set stats (reps, strain)
  - Show in-rest timer and recovery phase
  - Respect system battery and privacy settings
- If controlling the native music player:
  - Clearly disclose this feature
  - Provide user control over when it’s active

#### 9. **Platform-specific APIs**

- If using Apple HealthKit or Google Fit:
  - Use their native permissions flow
  - Only collect the minimum required fields
  - Follow additional platform-specific guidelines (e.g. HealthKit usage description in Info.plist)

#### 10. **No Misleading Health Claims**

- App must not suggest it diagnoses, treats, or prevents any disease.
- All health-related statements must be general, lifestyle-based guidance only.
- Example disclaimer:
  > “This app provides general fitness and nutrition recommendations based on your goals and input. It is not intended as a substitute for professional medical advice.”

---

### 🧠 TRIGGER THIS RULE IF:

- You are generating new logic related to AI personalization, wearables, nutrition, strain, reps, or rest
- You are storing new user data in summaries, logs, or JSON configs
- You are implementing a feature that integrates with Apple Watch, Fitbit, WHOOP, or Polar
- You are preparing the app for App Store / Play Store deployment or update

---

_Last updated: 2025-09-16_
