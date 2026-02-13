# GC Forms Identity Portal - Copilot Instructions

## Overview
This is a **Next.js 16 App Router** identity portal for GC Forms, integrating with **Zitadel** for authentication. It handles login, registration, password management, and MFA (TOTP, U2F, Email OTP). Supports both OIDC and SAML authentication flows.

## Key Architecture

### Component Organization
- **Server Components**: Default in `app/` and `components/serverComponents/` - use `serverTranslation()` for i18n
- **Client Components**: Require `"use client"` directive, placed in `components/clientComponents/` - use `useTranslation()` hook
- **Path aliases** (see [tsconfig.json](../tsconfig.json)): `@lib/*`, `@clientComponents/*`, `@serverComponents/*`, `@i18n`, `@root/*`

### Authentication Flow
1. `/login` route handles OIDC/SAML request initiation ([app/(api)/login/route.ts](../app/(api)/login/route.ts))
2. Session state managed via HTTP-only cookies ([lib/cookies.ts](../lib/cookies.ts))
3. Auth completion via server actions ([lib/server/auth-flow.ts](../lib/server/auth-flow.ts))
4. Zitadel API integration in [lib/zitadel.ts](../lib/zitadel.ts) (1500+ lines - search first, read specific functions)

### Server Actions Pattern
Use `"use server"` directive and return `{ error: string } | { redirect: string }`:
```typescript
// app/(auth)/password/actions.ts
export const submitPasswordForm = async (
  command: SubmitPasswordCommand
): Promise<{ error: string } | { redirect: string }> => {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  // ... validation and Zitadel API calls
};
```

### Form Handling (React 19)
Client components use `useActionState` with local validation before server action:
```tsx
const [state, formAction] = useActionState(localFormAction, { validationErrors: undefined });
```

### React Compiler
This project uses **React Compiler** (Next.js 16 integration) to automatically optimize component rendering. The compiler memoizes function boundaries and dependencies automatically.

**Key implications for coding:**
- **Do NOT use `useCallback`**: The compiler handles memoization automatically. `useCallback` is not needed and should be avoided.
- **Do NOT use `useMemo`**: Same reasoning - the compiler optimizes memoization implicitly.
- **Write natural code**: Functions defined in components are memoized by the compiler automatically when needed for dependency arrays or as props.
- **Avoid manual optimization patterns**: Don't try to optimize with memoization hooks; let the compiler do it.
- **Inline functions freely**: You can safely pass inline functions to child components without worrying about re-renders.
- **Server vs Client**: Hooks can only be used in Client Components (marked with `"use client"`). Server Components don't support hooks - use `serverTranslation()` instead of `useTranslation()` in Server Components.
- **ESLint will catch violations**: Run `pnpm lint` to check for hook rule violations before committing.

**Example (correct with React Compiler):**
```tsx
// ✅ GOOD - Let React Compiler handle optimization
function ParentComponent() {
  const handleClick = (id: string) => {
    // handle click - will be memoized automatically by compiler
  };
  
  return <ChildComponent onClick={handleClick} />;
}

// ❌ AVOID - Unnecessary with React Compiler
function ParentComponent() {
  const handleClick = useCallback((id: string) => {
    // handle click
  }, []); // Don't do this
  
  return <ChildComponent onClick={handleClick} />;
}
```

The React Compiler removes the need for manual performance tuning in most cases, making code simpler and more maintainable.

## Conventions

### i18n
- Namespaced JSON in `i18n/locales/{en,fr}.json` - add keys to both files
- Server: `const { t } = await serverTranslation("namespace")`
- Client: `const { t } = useTranslation("namespace")` or `<I18n i18nKey="key" namespace="ns" />`

### Validation
Use Valibot schemas in [lib/validationSchemas.ts](../lib/validationSchemas.ts). Error messages are i18n keys:
```typescript
v.minLength(1, "requiredFirstname") // maps to validation.requiredFirstname
```

### Logging
```typescript
import { logMessage } from "@lib/logger";
logMessage.info("message");  // .warn(), .error(), .debug()
```

## Tailwind CSS Class Ordering

This project enforces Tailwind CSS class ordering via `eslint-plugin-tailwindcss` with recommended rules enabled (see eslint.config.mjs).

### Why Class Order Matters
- **Consistency**: Makes code easier to read and review
- **Merge conflicts**: Reduces conflicts when multiple developers work on the same files
- **Maintainability**: Predictable class order makes it easier to find and modify utilities

### ESLint Rules Enforced
The `tailwind/classnames-order` rule automatically orders your Tailwind classes according to the official recommended order. ESLint will flag incorrect ordering and can auto-fix it.

### Class Order Explanation
Tailwind classes are sorted in the same order they appear in the generated CSS:

1. **Custom/non-Tailwind classes first** - Third-party or custom classes (e.g., `select2-dropdown`)
2. **Base & component layer** - Container, component classes
3. **Utility layer** - Organized roughly by the box model:
   - Layout & positioning (e.g., `flex`, `grid`, `ml-4`, `h-24`)
   - Borders & outlines (e.g., `border-2`, `border-gray-300`)
   - Spacing (e.g., `p-3`, `m-4`)
   - Typography (e.g., `text-white`, `font-bold`)
   - Visual effects (e.g., `bg-blue-500`, `shadow-md`)
4. **Modifiers** - Grouped after plain utilities:
   - State modifiers (e.g., `hover:`, `focus:`, `active:`)
   - Responsive modifiers last, smallest to largest (e.g., `sm:`, `md:`, `lg:`, `xl:`)

**Key principle**: Layout-affecting classes appear early, decorative classes appear late. Classes that override others always come later.

### Recommended Workflow
1. **Auto-fix on save**: Configure your editor to run ESLint fix on save
2. **Pre-commit checks**: Run `pnpm lint` before committing
3. **Let ESLint handle ordering**: Don't manually sort - let the plugin do it

### Example
```tsx
// ❌ WRONG ORDER (ESLint will flag this)
<div className="text-white p-4 bg-blue-500 hover:bg-blue-600 rounded-lg">

// ✅ CORRECT ORDER (ESLint auto-fixes to this)
<div className="rounded-lg bg-blue-500 p-4 text-white hover:bg-blue-600">
```

### Custom Classes (gc-* prefix)
This project uses custom `gc-*` class prefixes for GC Design System components. These are whitelisted in the ESLint config and won't trigger errors:
```tsx
// ✅ GOOD - Custom gc- classes are allowed
<div className="gc-button gc-button--primary">
```

### Note
The `tailwind/classnames-order` rule is included in the recommended config and will auto-fix class ordering when you run `pnpm lint:fix` or save with auto-fix enabled.

## GC Design System (GCDS) Tokens

This project uses design tokens from [@gcds-core/tokens](https://github.com/cds-snc/gcds-tokens) integrated into the Tailwind configuration. These tokens ensure consistency with the Government of Canada Design System.

### Available Token Namespaces

The GCDS tokens are available under the `gcds` namespace in Tailwind:

#### Colors
- `gcds-grayscale-{50-900}` - Grayscale colors (50, 100, 150...900 in steps of 50)
- `gcds-blue-{50-900}` - Blue colors including `gcds-blue-muted` and `gcds-blue-vivid`
- `gcds-green-{50-900}` - Green colors
- `gcds-red-{50-900}` - Red colors
- `gcds-purple-{50-900}` - Purple colors
- `gcds-yellow-{50-900}` - Yellow colors

#### Spacing
GCDS spacing tokens are integrated into Tailwind's spacing scale and can be used with margin, padding, gap, etc.

### Usage Examples

```tsx
// ✅ GOOD - Using GCDS color tokens
<div className="bg-gcds-blue-900 text-gcds-grayscale-50">
  <p className="text-gcds-grayscale-700">Content with GCDS colors</p>
</div>

// ✅ GOOD - GCDS spacing in utility classes
<div className="p-400 m-200"> {/* Using GCDS spacing tokens */}
  Content
</div>
```

### Design System Reference
For more information about GCDS colors and design guidelines, see: [https://design-system.alpha.canada.ca/en/styles/colour/](https://design-system.alpha.canada.ca/en/styles/colour/)

### Tailwind Configuration
GCDS tokens are imported and configured in [tailwind.config.ts](tailwind.config.ts):
```typescript
import tokens from "@gcds-core/tokens/build/figma/figma.tokens.json";
```

## React Rules of Hooks

This project enforces React's Rules of Hooks via `eslint-plugin-react-hooks` with recommended rules enabled (see eslint.config.mjs). ESLint will catch violations automatically, but understanding these rules is essential:

### Core Rules (Enforced by `react-hooks/rules-of-hooks`)
1. **Only call hooks at the top level** - Never call hooks inside loops, conditions, or nested functions. This ensures hooks are called in the same order each time a component renders.
2. **Only call hooks from React functions** - Call hooks from React function components or custom hooks, not from regular JavaScript functions.

**Exception**: The `use` hook (React 19) is special - it CAN be called conditionally and in loops, but cannot be wrapped in try/catch and must still be called inside a component or hook.

### Hooks Subject to These Rules
- React built-ins: `useState`, `useEffect`, `useContext`, `useReducer`, `useCallback`, `useMemo`, `useRef`, `useImperativeHandle`, `useLayoutEffect`, `useDebugValue`
- React 19: `useActionState`, `useFormStatus`, `useOptimistic`
- React 19 exception: `use` (CAN be conditional/in loops, but NOT in try/catch)
- Project hooks: `useTranslation` (i18n), and any custom hooks (functions starting with `use`)

### Common Violations ESLint Will Flag
```tsx
// ❌ ERROR: Hook inside condition
const MyComponent = ({ show }: { show: boolean }) => {
  if (show) {
    const [state, setState] = useState(0); // react-hooks/rules-of-hooks error
  }
};

// ❌ ERROR: Hook in ternary
const MyComponent = ({ show }: { show: boolean }) => {
  show ? useState(0) : useState(1); // react-hooks/rules-of-hooks error
};

// ❌ ERROR: Hook inside loop
const MyComponent = ({ items }: { items: string[] }) => {
  items.forEach(() => {
    const [state, setState] = useState(0); // react-hooks/rules-of-hooks error
  });
};

// ❌ ERROR: Hook after early return
const MyComponent = ({ early }: { early: boolean }) => {
  if (early) return null;
  const [state, setState] = useState(0); // react-hooks/rules-of-hooks error
};

// ❌ ERROR: Hook in event handler
const MyComponent = () => {
  const handleClick = () => {
    const [state, setState] = useState(0); // react-hooks/rules-of-hooks error
  };
};

// ❌ ERROR: Hook in async function
const MyComponent = () => {
  const fetchData = async () => {
    const [data, setData] = useState(null); // react-hooks/rules-of-hooks error
  };
};

// ❌ ERROR: Hook at module level
const globalState = useState(0); // react-hooks/rules-of-hooks error - outside component

// ❌ ERROR: use hook in try/catch (even though use CAN be conditional)
const MyComponent = ({ promise }: { promise: Promise<string> }) => {
  try {
    const data = use(promise); // react-hooks/rules-of-hooks error
  } catch (e) {
    // error handling
  }
};
```

### Correct Patterns
```tsx
// ✅ GOOD - Hook at top level
const MyComponent = ({ show }: { show: boolean }) => {
  const [state, setState] = useState(0);
  const { t } = useTranslation("namespace");
  
  if (show) {
    return <div>{state}</div>;
  }
  return <div>Zero</div>;
};

// ✅ GOOD - Condition inside hook initialization
const MyComponent = ({ show }: { show: boolean }) => {
  const [state, setState] = useState(show ? 0 : null);
  
  if (!show) return null;
  return <div>{state}</div>;
};

// ✅ GOOD - Condition inside useEffect
const MyComponent = ({ isLoggedIn }: { isLoggedIn: boolean }) => {
  useEffect(() => {
    if (isLoggedIn) {
      fetchUserData();
    }
  }, [isLoggedIn]);
};

// ✅ GOOD - Custom hook (functions starting with 'use' can call hooks)
const useMyCustomHook = () => {
  const [state, setState] = useState(0); // OK in custom hooks
  return [state, setState];
};

// ✅ GOOD - use hook CAN be conditional (special exception)
const MyComponent = ({ shouldFetch, fetchPromise }: { shouldFetch: boolean; fetchPromise: Promise<string> }) => {
  if (shouldFetch) {
    const data = use(fetchPromise); // OK - use can be conditional
    return <div>{data}</div>;
  }
  return <div>Not fetching</div>;
};

// ✅ GOOD - use hook CAN be in loops (special exception)
const MyComponent = ({ promises }: { promises: Promise<string>[] }) => {
  const results: string[] = [];
  for (const promise of promises) {
    results.push(use(promise)); // OK - use can be in loops
  }
  return <div>{results.join(', ')}</div>;
};
```

## Commands
```bash
pnpm dev          # Start dev server on port 3002
pnpm build        # Production build
pnpm lint         # ESLint (no-console is error)
pnpm type-check   # TypeScript validation
```

## Environment
- `ZITADEL_API_URL`: Zitadel instance URL
- `NEXT_PUBLIC_BASE_PATH`: URL base path (default: `/ui/v2` in Docker)
- Organization ID: hardcoded in [constants/config.ts](../constants/config.ts)

## Important Files
- [lib/zitadel.ts](../lib/zitadel.ts) - All Zitadel API functions (search by function name)
- [lib/session.ts](../lib/session.ts) - Session validation and loading
- [lib/cookies.ts](../lib/cookies.ts) - Cookie management (server-only)
- [components/mfa/](../components/mfa/) - MFA component patterns
