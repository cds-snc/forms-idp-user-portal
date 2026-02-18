---
description: 'ReactJS development standards and best practices'
applyTo: '**/*.tsx, **/*.ts'
---

# ReactJS Development Instructions

Instructions for building high-quality ReactJS applications with modern patterns, hooks, and best practices following the official React documentation at https://react.dev.

## Project Context
- Latest React version (React 19+)
- TypeScript for type safety (when applicable)
- Functional components with hooks as default
- Follow React's official style guide and best practices
- Implement proper component composition and reusability patterns

## Development Standards

### Architecture
- Use functional components with hooks as the primary pattern
- Implement component composition over inheritance
- Use custom hooks for reusable stateful logic
- Implement proper component hierarchies with clear data flow

### TypeScript Integration
- Use TypeScript interfaces for props, state, and component definitions
- Define proper types for event handlers and refs
- Implement generic components where appropriate
- Use strict mode in `tsconfig.json` for type safety
- Leverage React's built-in types (`React.FC`, `React.ComponentProps`, etc.)
- Create union types for component variants and states


### Styling
- See nextjs-tailwind instructions for Tailwind CSS usage and class ordering

### Error Handling
- Implement Error Boundaries for component-level error handling
- Use proper error states in data fetching
- Implement fallback UI for error scenarios
- Log errors appropriately for debugging
- Handle async errors in effects and event handlers
- Provide meaningful error messages to users

### Security
- Sanitize user inputs to prevent XSS attacks
- Validate and escape data before rendering
- Use HTTPS for all external API calls
- Implement proper authentication and authorization patterns
- Avoid storing sensitive data in localStorage or sessionStorage
- Use Content Security Policy (CSP) headers

### Accessibility
- Use semantic HTML elements appropriately
- Implement proper ARIA attributes and roles
- Ensure keyboard navigation works for all interactive elements
- Provide alt text for images and descriptive text for icons
- Implement proper color contrast ratios
- Test with screen readers and accessibility tools

## Additional Guidelines
- Use ESLint and Prettier for consistent code formatting

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

