import { AuthLevel } from "./server/route-protection";

/**
 * Route patterns mapped to their required authentication levels
 */
export const ROUTE_PATTERNS: Record<string, AuthLevel> = {
  // Account management - requires full authentication with strong MFA
  "/account": AuthLevel.STRONG_MFA_REQUIRED,

  // Password change - requires password to be verified
  "/password/change": AuthLevel.PASSWORD_REQUIRED,

  // MFA selection (during auth flow) - requires password
  "/mfa": AuthLevel.PASSWORD_REQUIRED,

  // Password entry - requires basic session
  "/password": AuthLevel.BASIC_SESSION,

  // Password set (new users) - requires basic session
  "/password/set": AuthLevel.BASIC_SESSION,

  // OTP verification pages - require basic session
  "/otp": AuthLevel.BASIC_SESSION,

  // U2F verification - requires basic session
  "/u2f": AuthLevel.BASIC_SESSION,

  // MFA setup - requires basic session
  "/mfa/set": AuthLevel.BASIC_SESSION,
};

/**
 * Fully open routes - no authentication required
 */
export const PUBLIC_ROUTES = [
  "/", // Login/username entry
  "/login", // OIDC/SAML initiation
  "/register", // User registration
  "/register/password", // Registration password setup
  "/password/reset", // Password reset request
  "/verify", // Email verification
  "/verify/success", // Email verification success
  "/all-set", // Completion page
  "/healthy", // Health check
  "/security", // Security settings (cached)
  "/logout-session", // Session termination
  "/error", // Error pages
];

/**
 * Routes that are part of multi-step authentication flows
 * These routes may need special handling to preserve flow state
 */
export const AUTH_FLOW_ROUTES = [
  "/password",
  "/password/set",
  "/mfa",
  "/mfa/set",
  "/otp/time-based",
  "/otp/sms",
  "/otp/email",
  "/otp/time-based/set",
  "/otp/sms/set",
  "/otp/email/set",
  "/u2f",
  "/u2f/set",
  "/verify",
];

/**
 * Routes requiring strict validation at both middleware and page level
 * These are high-value targets that need defense in depth
 */
export const STRICT_ROUTES = ["/account", "/password/change"];

/**
 * API routes that should not be processed by auth middleware
 * (Static assets and Next.js internals are already excluded by matcher)
 */
export const API_ROUTES = ["/api", "/healthy", "/security", "/login", "/logout-session"];

/**
 * Check if a pathname matches any pattern in a list
 */
export function matchesPattern(pathname: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    if (pattern.endsWith("*")) {
      // Wildcard match
      const prefix = pattern.slice(0, -1);
      return pathname.startsWith(prefix);
    }
    return pathname === pattern || pathname.startsWith(pattern + "/");
  });
}

/**
 * Get the required authentication level for a given pathname
 * Returns AuthLevel.OPEN for public routes
 */
export function getRequiredAuthLevel(pathname: string): AuthLevel {
  // Check if it's a public route
  if (matchesPattern(pathname, PUBLIC_ROUTES)) {
    return AuthLevel.OPEN;
  }

  // Check exact matches first
  if (pathname in ROUTE_PATTERNS) {
    return ROUTE_PATTERNS[pathname];
  }

  // Check for prefix matches (e.g., /account/settings matches /account)
  for (const [pattern, level] of Object.entries(ROUTE_PATTERNS)) {
    if (pathname.startsWith(pattern + "/")) {
      return level;
    }
  }

  // Default to open for unmatched routes
  // In production, you might want to default to BASIC_SESSION for safety
  return AuthLevel.OPEN;
}
