"use server";

/*--------------------------------------------*
 * Framework and Third-Party
 *--------------------------------------------*/

import { create } from "@zitadel/client";
import { UpdateHumanUserRequestSchema } from "@zitadel/proto/zitadel/user/v2/user_service_pb";

/*--------------------------------------------*
 * Internal Aliases
 *--------------------------------------------*/
import { AuthenticatedAction, type SessionCredentials } from "@lib/actions/authenticated";
import { logMessage } from "@lib/logger";
import * as z from "@lib/zitadel";

/*--------------------------------------------*
 * Framework and Third-Party
 *--------------------------------------------*/

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
function validateUserCanAccessUserId(
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
function validateSessionCredentials(credentials: SessionCredentials): boolean {
  return (
    !!credentials && !!credentials.sessionId && !!credentials.loginName && !!credentials.userId
  );
}

/**
 * Protected wrapper for removeU2F.
 * Ensures user can only remove their own U2F devices.
 *
 * @security Requires authenticated session. Removing MFA devices is sensitive.
 */
export const protectedRemoveU2F = AuthenticatedAction(
  async (credentials: SessionCredentials, userId: string, u2fId: string) => {
    if (!validateSessionCredentials(credentials)) {
      return { error: "Invalid session credentials" };
    }

    if (!validateUserCanAccessUserId(credentials.userId, userId)) {
      logMessage.warn(
        `Unauthorized attempt to remove U2F for userId ${userId} by user ${credentials.loginName}`
      );
      return { error: "Unauthorized" };
    }

    try {
      return await z.removeU2F({ userId, u2fId });
    } catch (error) {
      logMessage.error(`Failed to remove U2F for ${userId}`, error);
      return { error: "Failed to remove U2F" };
    }
  }
);

/**
 * Protected wrapper for removeTOTP.
 * Ensures user can only remove TOTP from their own account.
 *
 * @security Requires authenticated session. Removing MFA methods is sensitive.
 */
export const protectedRemoveTOTP = AuthenticatedAction(
  async (credentials: SessionCredentials, userId: string) => {
    if (!validateSessionCredentials(credentials)) {
      return { error: "Invalid session credentials" };
    }

    if (!validateUserCanAccessUserId(credentials.userId, userId)) {
      logMessage.warn(
        `Unauthorized attempt to remove TOTP for userId ${userId} by user ${credentials.loginName}`
      );
      return { error: "Unauthorized" };
    }

    try {
      return await z.removeTOTP({ userId });
    } catch (error) {
      logMessage.error(`Failed to remove TOTP for ${userId}`, error);
      return { error: "Failed to remove TOTP" };
    }
  }
);

/**
 * Protected wrapper for getTOTPStatus.
 * Ensures user can only check TOTP status for their own account.
 *
 * @security Requires authenticated session. Reveals whether MFA is enabled.
 */
export const protectedGetTOTPStatus = AuthenticatedAction(
  async (credentials: SessionCredentials, userId: string) => {
    if (!validateSessionCredentials(credentials)) {
      return { error: "Invalid session credentials" };
    }

    if (!validateUserCanAccessUserId(credentials.userId, userId)) {
      logMessage.warn(
        `Unauthorized attempt to check TOTP status for userId ${userId} by user ${credentials.loginName}`
      );
      return { error: "Unauthorized" };
    }

    try {
      return await z.getTOTPStatus({ userId });
    } catch (error) {
      logMessage.error(`Failed to get TOTP status for ${userId}`, error);
      return { error: "Failed to get TOTP status" };
    }
  }
);

/**
 * Protected wrapper for getU2FList.
 * Ensures user can only list their own registered U2F devices.
 *
 * @security Requires authenticated session. Device list is sensitive metadata.
 */
export const protectedGetU2FList = AuthenticatedAction(
  async (credentials: SessionCredentials, userId: string) => {
    if (!validateSessionCredentials(credentials)) {
      return { error: "Invalid session credentials" };
    }

    if (!validateUserCanAccessUserId(credentials.userId, userId)) {
      logMessage.warn(
        `Unauthorized attempt to list U2F devices for userId ${userId} by user ${credentials.loginName}`
      );
      return { error: "Unauthorized" };
    }

    try {
      return await z.getU2FList({ userId });
    } catch (error) {
      logMessage.error(`Failed to get U2F list for ${userId}`, error);
      return { error: "Failed to get U2F list" };
    }
  }
);

/**
 * Protected wrapper for protectedUpdatePersonalDetails.
 * Ensures user can only update their own profile data.
 *
 * @security Requires authenticated session. Verifies userId matches authenticated user.
 */
export const protectedUpdatePersonalDetails = AuthenticatedAction(
  async (
    credentials: SessionCredentials,
    userId: string,
    account: { firstName: string; lastName: string }
  ) => {
    if (!validateSessionCredentials(credentials)) {
      return { error: "Invalid session credentials" };
    }

    if (!validateUserCanAccessUserId(credentials.userId, userId)) {
      logMessage.warn(
        `Unauthorized attempt to update userId ${userId} by user ${credentials.loginName}`
      );
      return { error: "Unauthorized" };
    }

    try {
      const request = create(UpdateHumanUserRequestSchema, {
        userId,
        profile: {
          givenName: account.firstName,
          familyName: account.lastName,
          displayName: `${account.firstName} ${account.lastName}`,
        },
        // Note: leaving here for reference encase we want to update the username as well
        // email: {
        //   email: account.email,
        // },
        // username: account.email,
      });
      return await z.updateHuman({ request });
    } catch (error) {
      logMessage.error(`Failed to update user ${userId}`, error);
      return { error: "Failed to update user" };
    }
  }
);
