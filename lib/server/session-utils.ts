import "server-only";
import { type SessionCredentials } from "@lib/actions/authenticated";

/**
 * Validates that a user can access a specific userId.
 * Prevents lateral access to other users' data.
 *
 * @param sessionUserId - User ID from authenticated session
 * @param targetUserId - User ID being accessed
 * @returns true if user can access the target, false otherwise
 *
 * @security
 * Currently only allows exact user ID match (self-access).
 * Extend with admin/role checks if needed in future.
 */
export function validateUserCanAccessUserId(
  sessionUserId: string | undefined,
  targetUserId: string
): boolean {
  return sessionUserId === targetUserId;
}

/**
 * Validates that session credentials contain required fields.
 * Used as a secondary check in protected wrappers.
 *
 * @param credentials - Session credentials object
 * @returns true if all required fields present, false otherwise
 */
export function validateSessionCredentials(credentials: SessionCredentials): boolean {
  return !!credentials && !!credentials.sessionId && !!credentials.loginName;
}
