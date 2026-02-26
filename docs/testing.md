# Testing Guide

This project uses Vitest + Testing Library for unit tests.

## Configuration

- Test runner config: `vitest.config.ts`
- Global setup: `test/setup.ts`
- Environment: `jsdom`
- Path aliases: `vite-tsconfig-paths`
- Coverage provider: `v8`
- Coverage reporters: `text`, `html`, `json-summary`
- Coverage include scope: `app/**/*.{ts,tsx}`, `lib/**/*.{ts,tsx}`, `components/**/*.{ts,tsx}`
- Coverage exclude scope: test files, `test/**`, declarations, build output, and dependencies

### Coverage thresholds

Global minimums are enforced during `pnpm test:coverage`:

- statements: `10`
- branches: `10`
- functions: `10`
- lines: `10`

### Scripts

- `pnpm test`: run all tests once
- `pnpm test:watch`: run tests in watch mode
- `pnpm test:coverage`: generate coverage output

## CI Expectations

CI runs in `.github/workflows/ci.yml` and executes:

1. `pnpm lint`
2. `pnpm test`
3. `pnpm test:coverage` (pull requests only)
4. `pnpm build`

For pull requests, CI also posts a coverage comment based on `coverage/coverage-summary.json`.

Local changes should pass the same sequence before merge.

## File Placement

- Keep tests near implementation files where practical:
  - `app/(auth)/actions.test.ts`
  - `app/(auth)/register/actions.test.ts`
  - `app/(auth)/register/components/RegisterForm.test.tsx`
- Use `*.test.ts` for server/action tests and `*.test.tsx` for React component tests.

## Shared Test Helpers

- Server action setup: `test/helpers/serverAction.ts`
  - `setupServerActionContext()` standardizes mocked `headers`, `serviceUrl`, and `serverTranslation`.
- Client/UI setup: `test/helpers/client.ts`
  - `createTranslationStub()` returns a stable i18n stub.
  - `createRouterStub()` returns a full `next/navigation` router mock.

Prefer these helpers over repeating boilerplate in each test file.

## Standards and Patterns

### 1) Keep tests behavior-focused

- Assert outcomes and contracts, not implementation details.
- Server actions: verify returned shapes (`{ error }`, `{ redirect }`, etc.).
- Components: verify what users see and can do (form errors, button states, navigation).

### 2) Use accessible queries first

- Prefer `getByRole` and `getByLabelText`.
- Use text queries only when role/label is not appropriate.

### 3) Mock boundaries, not everything

- Mock external dependencies (Next APIs, Zitadel, connectors, email senders).
- Keep business-flow assertions specific to each branch.
- Reuse shared helper defaults and override only what each test needs.

### 4) Cover branch-heavy flows explicitly

For auth and password/reset flows, include tests for:

- validation failure
- external call failure
- missing required data from upstream responses
- security behavior (non-enumerating responses)
- successful path and redirect behavior

### 5) Keep assertions precise

- Verify key calls and payloads for critical steps.
- Example: session/check creation payloads, redirect destinations, and callback calls.

## Writing New Tests

Use this workflow:

1. Add test file beside target source.
2. Start from shared helpers (`serverAction` or `client`).
3. Add a default successful setup in `beforeEach`.
4. Add focused branch tests by overriding one dependency per case.
5. Run `pnpm lint` and `pnpm test`.

## Current Coverage Areas (Auth)

- Login screen (`LoginForm`) behavior
- Login server action branch behavior
- Register server action behavior
- Register form behavior
- Set-register-password form behavior
- Password reset username action + form behavior

As new auth flows are added, follow these same patterns to keep tests consistent.
