# Test Strategy for Technically Fit

## Framework

- All tests use [Vitest](https://vitest.dev/) for both backend (Convex functions) and frontend (SvelteKit UI).

## Backend (Convex)

- Unit and integration tests for all business logic in `/app/convex/functions/`.
- Stripe API is not connected: all Stripe calls are mocked or skipped.
- Focus on logic for exercises, fitnessData, marketplace, trainingPrograms, users, whoop, workouts, admin modules, payments, and purchases.

## Frontend (SvelteKit)

- Tests for all major routes, components, and stores in `/app/src/routes/` and `/app/src/lib/components/`.
- User flows covered: onboarding, preferences, dashboards, marketplace, purchase, config panels.
- Backend and Stripe calls are mocked as needed.

## Stripe Limitations

- No real Stripe API calls are made in tests.
- All payment and subscription logic is tested with mocks/stubs.
- When Stripe is connected, update tests to use test keys and enable integration tests.

## Running Tests

- Run all tests with:
  ```sh
  pnpm vitest
  ```
- Or run specific tests:
  ```sh
  pnpm vitest run app/convex/__tests__/exercises.test.ts
  ```

## Adding Tests

- Place backend tests in `/app/convex/__tests__/`
- Place frontend tests in `/app/src/__tests__/`
- Use `vi.mock()` for external APIs and backend calls.

## Coverage

- Ensure all major features and flows are covered.
- Add regression tests for bugs and edge cases.

---

_Last updated: 2025-09-18_
