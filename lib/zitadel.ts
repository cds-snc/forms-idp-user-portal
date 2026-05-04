/*--------------------------------------------*
 * Framework and Third-Party
 *--------------------------------------------*/
import { create, Duration } from "@zitadel/client";
import { createServerTransport as libCreateServerTransport } from "@zitadel/client/node";
import { makeReqCtx } from "@zitadel/client/v2";
import {
  OrganizationSchema,
  RequestContext,
  TextQueryMethod,
} from "@zitadel/proto/zitadel/object/v2/object_pb";
import { CreateCallbackRequest } from "@zitadel/proto/zitadel/oidc/v2/oidc_service_pb";
import { RequestChallenges } from "@zitadel/proto/zitadel/session/v2/challenge_pb";
import { Checks } from "@zitadel/proto/zitadel/session/v2/session_service_pb";
import { LoginSettings } from "@zitadel/proto/zitadel/settings/v2/login_settings_pb";
import { ReturnEmailVerificationCodeSchema } from "@zitadel/proto/zitadel/user/v2/email_pb";
import type { RedirectURLsJson } from "@zitadel/proto/zitadel/user/v2/idp_pb";
import { ReturnPasswordResetCodeSchema } from "@zitadel/proto/zitadel/user/v2/password_pb";
import { SearchQuery, SearchQuerySchema } from "@zitadel/proto/zitadel/user/v2/query_pb";
import {
  AddHumanUserRequest,
  AddHumanUserRequestSchema,
  SendEmailCodeRequestSchema,
  SetPasswordRequest,
  SetPasswordRequestSchema,
  UpdateHumanUserRequest,
  VerifyU2FRegistrationRequest,
} from "@zitadel/proto/zitadel/user/v2/user_service_pb";

// import { unstable_cacheLife as cacheLife } from "next/cache";
import { serverTranslation } from "@i18n/server";

import { getUserAgent } from "./fingerprint";
import { logMessage } from "./logger";
import { getServiceForHost } from "./service";
import { getSerializableObject } from "./utils";

const useCache = process.env.DEBUG !== "true";

async function cacheWrapper<T>(callback: Promise<T>) {
  // "use cache";
  // cacheLife("hours");

  return callback;
}

export async function getLoginSettings({ organization }: { organization?: string }) {
  const settingsService = await getServiceForHost("SettingsService");

  const callback = settingsService
    .getLoginSettings({ ctx: makeReqCtx(organization) }, {})
    .then((resp) => (resp.settings ? resp.settings : undefined));

  return useCache ? cacheWrapper(callback) : callback;
}

export async function getSerializableLoginSettings({
  organizationId,
}: {
  organizationId?: string;
}) {
  const loginSettings = await getLoginSettings({
    organization: organizationId,
  }).then((obj) => getSerializableObject(obj));

  if (!loginSettings) {
    throw new Error("No login settings found");
  }

  return loginSettings;
}

export async function getSecuritySettings() {
  const settingsService = await getServiceForHost("SettingsService");

  const callback = settingsService
    .getSecuritySettings({})
    .then((resp) => (resp.settings ? resp.settings : undefined));

  return useCache ? cacheWrapper(callback) : callback;
}

export async function getLockoutSettings({ orgId }: { orgId?: string }) {
  const settingsService = await getServiceForHost("SettingsService");

  const callback = settingsService
    .getLockoutSettings({ ctx: makeReqCtx(orgId) }, {})
    .then((resp) => (resp.settings ? resp.settings : undefined));

  return useCache ? cacheWrapper(callback) : callback;
}

/**
 * @security Requires authenticated session. Use protectedGetPasswordExpirySettings from lib/server/zitadel-protected.ts
 */
export async function getPasswordExpirySettings({ orgId }: { orgId?: string }) {
  const settingsService = await getServiceForHost("SettingsService");

  const callback = settingsService
    .getPasswordExpirySettings({ ctx: makeReqCtx(orgId) }, {})
    .then((resp) => (resp.settings ? resp.settings : undefined));

  return useCache ? cacheWrapper(callback) : callback;
}

/**
 * @security Requires authenticated session. Use protectedListIDPLinks from lib/server/zitadel-protected.ts
 */
export async function listIDPLinks({ userId }: { userId: string }) {
  const userService = await getServiceForHost("UserService");

  return userService.listIDPLinks({ userId }, {});
}

/**
 * @security Requires authenticated session. Returns cryptographic secret material. Use protectedRegisterTOTP from lib/server/zitadel-protected.ts
 */
export async function registerTOTP({ userId }: { userId: string }) {
  const userService = await getServiceForHost("UserService");

  return userService.registerTOTP({ userId }, {});
}

export async function getPasswordComplexitySettings({ organization }: { organization?: string }) {
  const settingsService = await getServiceForHost("SettingsService");

  const callback = settingsService
    .getPasswordComplexitySettings({ ctx: makeReqCtx(organization) })
    .then((resp) => (resp.settings ? resp.settings : undefined));

  return useCache ? cacheWrapper(callback) : callback;
}

/**
 * @security Creates authenticated session after auth checks pass. Internal use in auth flow.
 */
export async function createSessionFromChecks({
  checks,
  lifetime,
}: {
  checks: Checks;
  lifetime: Duration;
}) {
  const sessionService = await getServiceForHost("SessionService");

  const userAgent = await getUserAgent();

  return sessionService.createSession({ checks, lifetime, userAgent }, {});
}

/**
 * @security Updates session state during auth flow. Internal use only.
 */
export async function setSession({
  sessionId,
  sessionToken,
  challenges,
  checks,
  lifetime,
}: {
  sessionId: string;
  sessionToken: string;
  challenges: RequestChallenges | undefined;
  checks?: Checks;
  lifetime: Duration;
}) {
  const sessionService = await getServiceForHost("SessionService");

  return sessionService.setSession(
    {
      sessionId,
      sessionToken,
      challenges,
      checks: checks ? checks : {},
      metadata: {},
      lifetime,
    },
    {}
  );
}

/**
 * @security Requires authenticated session tokens. Internal use only.
 */
export async function getSession({
  sessionId,
  sessionToken,
}: {
  sessionId: string;
  sessionToken: string;
}) {
  const sessionService = await getServiceForHost("SessionService");

  return sessionService.getSession({ sessionId, sessionToken }, {});
}

/**
 * @security Requires authenticated session tokens. Logout operation.
 */
export async function deleteSession({
  sessionId,
  sessionToken,
}: {
  sessionId: string;
  sessionToken: string;
}) {
  const sessionService = await getServiceForHost("SessionService");

  return sessionService.deleteSession({ sessionId, sessionToken }, {});
}

type ListSessionsCommand = {
  ids: string[];
};

/**
 * @security Internal use only. Lists sessions by their IDs.
 */
export async function listSessions({ ids }: ListSessionsCommand) {
  const sessionService = await getServiceForHost("SessionService");

  return sessionService.listSessions(
    {
      queries: [
        {
          query: {
            case: "idsQuery",
            value: { ids },
          },
        },
      ],
    },
    {}
  );
}

type AddHumanUserData = {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  organization: string;
};

export async function addHumanUser({
  email,
  firstName,
  lastName,
  password,
  organization,
}: AddHumanUserData) {
  const userService = await getServiceForHost("UserService");

  let addHumanUserRequest: AddHumanUserRequest = create(AddHumanUserRequestSchema, {
    email: {
      email,
      verification: {
        case: "isVerified",
        value: false,
      },
    },
    username: email,
    profile: { givenName: firstName, familyName: lastName },
    passwordType: password ? { case: "password", value: { password } } : undefined,
  });

  if (organization) {
    const organizationSchema = create(OrganizationSchema, {
      org: { case: "orgId", value: organization },
    });

    addHumanUserRequest = {
      ...addHumanUserRequest,
      organization: organizationSchema,
    };
  }

  return userService.addHumanUser(addHumanUserRequest);
}

/**
 * @security Requires authenticated session. Use protected wrapper from lib/server/zitadel-protected.ts
 */
export async function updateHuman({ request }: { request: UpdateHumanUserRequest }) {
  const userService = await getServiceForHost("UserService");

  return userService.updateHumanUser(request);
}

/**
 * @security Requires authenticated session. Use protectedVerifyTOTPRegistration from lib/server/zitadel-protected.ts
 */
export async function verifyTOTPRegistration({ code, userId }: { code: string; userId: string }) {
  const userService = await getServiceForHost("UserService");

  return userService.verifyTOTPRegistration({ code, userId }, {});
}

/**
 * @security Requires authenticated session. Use protectedGetUserByID from lib/server/zitadel-protected.ts
 */
export async function getUserByID({ userId }: { serviceUrl: string; userId: string }) {
  const userService = await getServiceForHost("UserService");

  return userService.getUserByID({ userId }, {});
}

export async function sendEmailCodeWithReturn({
  userId,
}: {
  serviceUrl: string;
  userId: string;
}): Promise<{ verificationCode?: string }> {
  const medium = create(SendEmailCodeRequestSchema, {
    userId,
    verification: {
      case: "returnCode",
      value: create(ReturnEmailVerificationCodeSchema, {}),
    },
  });

  const userService = await getServiceForHost("UserService");

  return userService.sendEmailCode(medium, {});
}

type ListUsersCommand = {
  loginName?: string;
  userName?: string;
  email?: string;
  phone?: string;
  organizationId?: string;
};

export async function listUsers({
  loginName,
  userName,
  phone,
  email,
  organizationId,
}: ListUsersCommand) {
  const queries: SearchQuery[] = [];

  // either use loginName or userName, email, phone
  if (loginName) {
    queries.push(
      create(SearchQuerySchema, {
        query: {
          case: "loginNameQuery",
          value: {
            loginName,
            method: TextQueryMethod.EQUALS,
          },
        },
      })
    );
  } else if (userName || email || phone) {
    const orQueries: SearchQuery[] = [];

    if (userName) {
      const userNameQuery = create(SearchQuerySchema, {
        query: {
          case: "userNameQuery",
          value: {
            userName,
            method: TextQueryMethod.EQUALS,
          },
        },
      });
      orQueries.push(userNameQuery);
    }

    if (email) {
      const emailQuery = create(SearchQuerySchema, {
        query: {
          case: "emailQuery",
          value: {
            emailAddress: email,
            method: TextQueryMethod.EQUALS,
          },
        },
      });
      orQueries.push(emailQuery);
    }

    if (phone) {
      const phoneQuery = create(SearchQuerySchema, {
        query: {
          case: "phoneQuery",
          value: {
            number: phone,
            method: TextQueryMethod.EQUALS,
          },
        },
      });
      orQueries.push(phoneQuery);
    }

    queries.push(
      create(SearchQuerySchema, {
        query: {
          case: "orQuery",
          value: {
            queries: orQueries,
          },
        },
      })
    );
  }

  if (organizationId) {
    queries.push(
      create(SearchQuerySchema, {
        query: {
          case: "organizationIdQuery",
          value: {
            organizationId,
          },
        },
      })
    );
  }

  const userService = await getServiceForHost("UserService");

  return userService.listUsers({ queries });
}

export type SearchUsersCommand = {
  serviceUrl: string;
  searchValue: string;
  loginSettings: LoginSettings;
  organizationId?: string;
  suffix?: string;
};

const PhoneQuery = (searchValue: string) =>
  create(SearchQuerySchema, {
    query: {
      case: "phoneQuery",
      value: {
        number: searchValue,
        method: TextQueryMethod.EQUALS,
      },
    },
  });

const LoginNameQuery = (searchValue: string) =>
  create(SearchQuerySchema, {
    query: {
      case: "loginNameQuery",
      value: {
        loginName: searchValue,
        method: TextQueryMethod.EQUALS_IGNORE_CASE,
      },
    },
  });

const EmailQuery = (searchValue: string) =>
  create(SearchQuerySchema, {
    query: {
      case: "emailQuery",
      value: {
        emailAddress: searchValue,
        method: TextQueryMethod.EQUALS_IGNORE_CASE,
      },
    },
  });

/**
 * this is a dedicated search function to search for users from the loginname page
 * it searches users based on the loginName or userName and org suffix combination, and falls back to email and phone if no users are found
 *  */
export async function searchUsers({
  searchValue,
  loginSettings,
  organizationId,
  suffix,
}: SearchUsersCommand) {
  const queries: SearchQuery[] = [];

  const { t } = await serverTranslation("zitadel");

  // if a suffix is provided, we search for the userName concatenated with the suffix
  if (suffix) {
    const searchValueWithSuffix = `${searchValue}@${suffix}`;
    const loginNameQuery = LoginNameQuery(searchValueWithSuffix);
    queries.push(loginNameQuery);
  } else {
    const loginNameQuery = LoginNameQuery(searchValue);
    queries.push(loginNameQuery);
  }

  if (organizationId) {
    queries.push(
      create(SearchQuerySchema, {
        query: {
          case: "organizationIdQuery",
          value: {
            organizationId,
          },
        },
      })
    );
  }

  const userService = await getServiceForHost("UserService");

  const loginNameResult = await userService.listUsers({ queries });

  if (!loginNameResult || !loginNameResult.details) {
    return { error: t("errors.errorOccured") };
  }

  if (loginNameResult.result.length > 1) {
    return { error: t("errors.multipleUsersFound") };
  }

  if (loginNameResult.result.length == 1) {
    return loginNameResult;
  }

  const emailAndPhoneQueries: SearchQuery[] = [];
  if (loginSettings.disableLoginWithEmail && loginSettings.disableLoginWithPhone) {
    // Both email and phone login are disabled, return empty result
    return { result: [] };
  } else if (loginSettings.disableLoginWithEmail && searchValue.length <= 20) {
    const phoneQuery = PhoneQuery(searchValue);
    emailAndPhoneQueries.push(phoneQuery);
  } else if (loginSettings.disableLoginWithPhone) {
    const emailQuery = EmailQuery(searchValue);
    emailAndPhoneQueries.push(emailQuery);
  } else {
    const orQuery: SearchQuery[] = [];

    const emailQuery = EmailQuery(searchValue);
    orQuery.push(emailQuery);

    let phoneQuery;
    if (searchValue.length <= 20) {
      phoneQuery = PhoneQuery(searchValue);
      orQuery.push(phoneQuery);
    }

    emailAndPhoneQueries.push(
      create(SearchQuerySchema, {
        query: {
          case: "orQuery",
          value: {
            queries: orQuery,
          },
        },
      })
    );
  }

  if (organizationId) {
    emailAndPhoneQueries.push(
      create(SearchQuerySchema, {
        query: {
          case: "organizationIdQuery",
          value: {
            organizationId,
          },
        },
      })
    );
  }

  const emailOrPhoneResult = await userService.listUsers({
    queries: emailAndPhoneQueries,
  });

  if (!emailOrPhoneResult || !emailOrPhoneResult.details) {
    return { error: t("errors.errorOccured") };
  }

  if (emailOrPhoneResult.result.length > 1) {
    return { error: t("errors.multipleUsersFound") };
  }

  if (emailOrPhoneResult.result.length == 1) {
    return emailOrPhoneResult;
  }

  // No users found - return empty result, not an error
  return { result: [] };
}

export async function getOrgsByDomain({ domain }: { domain: string }) {
  const orgService = await getServiceForHost("OrganizationService");

  return orgService.listOrganizations(
    {
      queries: [
        {
          query: {
            case: "domainQuery",
            value: { domain, method: TextQueryMethod.EQUALS },
          },
        },
      ],
    },
    {}
  );
}

export async function startIdentityProviderFlow({
  idpId,
  urls,
}: {
  idpId: string;
  urls: RedirectURLsJson;
}): Promise<string | null> {
  const userService = await getServiceForHost("UserService");

  return userService
    .startIdentityProviderIntent({
      idpId,
      content: {
        case: "urls",
        value: urls,
      },
    })
    .then(async (resp) => {
      if (resp.nextStep.case === "authUrl" && resp.nextStep.value) {
        return resp.nextStep.value;
      } else {
        return null;
      }
    });
}

export async function getAuthRequest({ authRequestId }: { authRequestId: string }) {
  const oidcService = await getServiceForHost("OIDCService");

  return oidcService.getAuthRequest({
    authRequestId,
  });
}

export async function createCallback({ req }: { req: CreateCallbackRequest }) {
  const oidcService = await getServiceForHost("OIDCService");

  return oidcService.createCallback(req);
}

export async function verifyEmail({
  userId,
  verificationCode,
}: {
  serviceUrl: string;
  userId: string;
  verificationCode: string;
}) {
  const userService = await getServiceForHost("UserService");

  return userService.verifyEmail(
    {
      userId,
      verificationCode,
    },
    {}
  );
}

export async function getIDPByID({ id }: { id: string }) {
  const idpService = await getServiceForHost("IdentityProviderService");

  return idpService.getIDPByID({ id }, {}).then((resp) => resp.idp);
}

/**
 * Request a password reset code that is returned instead of sent via email.
 * This allows sending the code via GC Notify instead of Zitadel's built-in email.
 */
export async function passwordResetWithReturn({
  userId,
}: {
  serviceUrl: string;
  userId: string;
}): Promise<{ verificationCode?: string }> {
  const medium = create(ReturnPasswordResetCodeSchema, {});

  const userService = await getServiceForHost("UserService");

  return userService.passwordReset(
    {
      userId,
      medium: {
        case: "returnCode",
        value: medium,
      },
    },
    {}
  );
}

export async function setUserPassword({
  userId,
  password,
  code,
}: {
  userId: string;
  password: string;
  code?: string;
}) {
  let payload = create(SetPasswordRequestSchema, {
    userId,
    newPassword: {
      password,
    },
  });

  if (code) {
    payload = {
      ...payload,
      verification: {
        case: "verificationCode",
        value: code,
      },
    };
  }

  const userService = await getServiceForHost("UserService");

  return userService.setPassword(payload, {}).catch((error) => {
    // throw error if failed precondition (ex. User is not yet initialized)
    if (error.code === 9 && error.message) {
      return { error: error.message };
    } else {
      throw error;
    }
  });
}

export async function setPassword({ payload }: { payload: SetPasswordRequest }) {
  const userService = await getServiceForHost("UserService");

  return userService.setPassword(payload, {});
}

/**
 * @security Requires authenticated session. Returns cryptographic challenge data. Use protectedRegisterU2F from lib/server/zitadel-protected.ts
 */
export async function registerU2F({
  userId,
  domain,
}: {
  serviceUrl: string;
  userId: string;
  domain: string;
}) {
  const userService = await getServiceForHost("UserService");

  return userService.registerU2F({
    userId,
    domain,
  });
}

/**
 * @security Requires authenticated session. Use protectedVerifyU2FRegistration from lib/server/zitadel-protected.ts
 */
export async function verifyU2FRegistration({
  request,
}: {
  serviceUrl: string;
  request: VerifyU2FRegistrationRequest;
}) {
  const userService = await getServiceForHost("UserService");

  return userService.verifyU2FRegistration(request, {});
}

/**
 *
 * @param host
 * @param orgId the organization ID
 * @param linking_allowed whether linking is allowed
 * @returns the active identity providers
 */
export async function getActiveIdentityProviders({
  orgId,
  linking_allowed,
}: {
  serviceUrl: string;
  orgId?: string;
  linking_allowed?: boolean;
}) {
  const props: { ctx: RequestContext; linkingAllowed?: boolean } = { ctx: makeReqCtx(orgId) };
  if (linking_allowed) {
    props.linkingAllowed = linking_allowed;
  }
  const settingsService = await getServiceForHost("SettingsService");

  return settingsService.getActiveIdentityProviders(props, {});
}

/**
 * @security Requires authenticated session. Use protectedListAuthenticationMethodTypes from lib/server/zitadel-protected.ts
 */
export async function listAuthenticationMethodTypes({
  userId,
}: {
  serviceUrl: string;
  userId: string;
}) {
  const userService = await getServiceForHost("UserService");

  return userService.listAuthenticationMethodTypes({
    userId,
  });
}

export function createServerTransport(token: string, baseUrl: string) {
  return libCreateServerTransport(token, {
    baseUrl,
    interceptors: !process.env.CUSTOM_REQUEST_HEADERS
      ? undefined
      : [
          (next) => {
            return (req) => {
              process.env.CUSTOM_REQUEST_HEADERS!.split(",").forEach((header) => {
                const kv = header.indexOf(":");
                if (kv > 0) {
                  req.header.set(header.slice(0, kv).trim(), header.slice(kv + 1).trim());
                } else {
                  logMessage.warn(
                    `Skipping malformed CUSTOM_REQUEST_HEADERS entry (expected key:value format)`
                  );
                }
              });
              return next(req);
            };
          },
        ],
  });
}

/**
 * Check whether a user has an authentication method (TOTP) attached to their account.
 * The current Zitadel API does not include the TOTP name so we can only show whether
 * TOTP is added/enabled or not.
 *
 * @security Requires authenticated session. Use protectedGetTOTPStatus from lib/server/zitadel-protected.ts
 */
export async function getTOTPStatus({ userId }: { userId: string }) {
  const userService = await getServiceForHost("UserService");

  const authMethodsResponse = await userService.listAuthenticationMethodTypes({ userId });
  const authMethodTypes = authMethodsResponse.authMethodTypes ?? [];

  return authMethodTypes.includes(4); // 4 = AuthenticationMethodType.TOTP
}

/**
 * @security Requires authenticated session. Use protectedGetU2FList from lib/server/zitadel-protected.ts
 */
export async function getU2FList({ userId }: { userId: string }) {
  const userService = await getServiceForHost("UserService");
  const authFactorsResponse = await userService.listAuthenticationFactors({ userId });

  return authFactorsResponse.result
    .filter((factor) => factor.type.case === "u2f")
    .map((factor) => {
      if (factor.type.case === "u2f") {
        return factor.type.value;
      }
      return undefined;
    })
    .filter((token): token is NonNullable<typeof token> => token !== undefined);
}

/**
 * @security Requires authenticated session. Removing MFA devices is sensitive. Use protectedRemoveU2F from lib/server/zitadel-protected.ts
 */
export async function removeU2F({
  userId,
  u2fId,
}: {
  serviceUrl: string;
  userId: string;
  u2fId: string;
}) {
  const userService = await getServiceForHost("UserService");

  return userService.removeU2F({
    userId,
    u2fId,
  });
}

/**
 * @security Requires authenticated session. Removing MFA methods is sensitive. Use protectedRemoveTOTP from lib/server/zitadel-protected.ts
 */
export async function removeTOTP({ userId }: { userId: string }) {
  const userService = await getServiceForHost("UserService");

  return userService.removeTOTP({
    userId,
  });
}
