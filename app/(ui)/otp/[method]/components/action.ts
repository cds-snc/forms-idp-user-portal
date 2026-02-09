import { completeFlowOrGetUrl } from "@lib/client";
import { updateSession } from "@lib/server/session";
import { sendOtpEmail } from "@lib/server/otp";
import { create } from "@zitadel/client";
import { ChecksSchema } from "@zitadel/proto/zitadel/session/v2/session_service_pb";
import { LoginSettings } from "@zitadel/proto/zitadel/settings/v2/login_settings_pb";
import { validateCode } from "@lib/validationSchemas";

export type FormState = {
  error?: string;
  validationErrors?: { fieldKey: string; fieldValue: string }[];
  formData?: {
    code?: string;
  };
};

type Inputs = {
  code: string;
};

type SubmitCodeParams = {
  loginName?: string;
  sessionId?: string;
  organization?: string;
  requestId?: string;
  method: string;
};

type SessionResponse = {
  sessionId?: string;
  factors?: {
    user?: {
      loginName: string;
      organizationId?: string;
    };
  };
  error?: string;
};

type OTPChallengeParams = {
  loginName?: string;
  sessionId?: string;
  organization?: string;
  requestId?: string;
  method: string;
};

export async function updateSessionForOTPChallenge(
  params: OTPChallengeParams
): Promise<{ error?: string; response?: SessionResponse }> {
  const { loginName, sessionId, organization, requestId, method } = params;

  // For email OTP, use GC Notify to send the code
  if (method === "email") {
    const result = await sendOtpEmail({
      loginName,
      sessionId,
      organization,
      requestId,
    });

    if (result.error) {
      return { error: result.error };
    }

    if (result.success) {
      return {
        response: {
          sessionId: result.sessionId,
          factors: result.factors,
        },
      };
    }

    return { error: "Failed to send OTP email" };
  }

  // For SMS OTP, we don't have challenges to set
  try {
    const response = await updateSession({
      loginName,
      sessionId,
      organization,
      requestId,
    });

    if (response && "error" in response && response.error) {
      return { error: response.error };
    }

    return { response };
  } catch {
    return { error: "Could not request OTP challenge" };
  }
}

export async function handleOTPFormSubmit(
  code: string,
  params: SubmitCodeParams & {
    loginSettings?: LoginSettings;
    t: (key: string) => string;
  }
): Promise<FormState & { redirect?: string }> {
  const { loginSettings, t, ...submitParams } = params;

  // Validate form entries and map any errors to form state with translated messages
  const validationResult = await validateCode({ code });
  if (!validationResult.success) {
    return {
      validationErrors: validationResult.issues.map((issue) => ({
        fieldKey: issue.path?.[0].key as string,
        fieldValue: t(`verify.validation.${issue.message}`),
      })),
      error: undefined,
      formData: { code },
    };
  }

  const response = await _submitOTPCode({ code }, submitParams);

  if (!response) {
    return {
      validationErrors: undefined,
      error: undefined,
      formData: { code },
    };
  }

  if (response.error) {
    return {
      validationErrors: undefined,
      error: response.error,
      formData: { code },
    };
  }

  if (response.sessionId && response.factors?.user) {
    // Wait for 2 seconds to avoid eventual consistency issues with an OTP code being verified in the /login endpoint
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Use unified approach that handles both OIDC/SAML and regular flows
    // Always include sessionId to ensure we load the exact session that was just updated
    const callbackResponse = await completeFlowOrGetUrl(
      submitParams.requestId
        ? {
            sessionId: response.sessionId,
            requestId: submitParams.requestId,
            organization: response.factors.user.organizationId,
          }
        : {
            sessionId: response.sessionId,
            loginName: response.factors.user.loginName,
            organization: response.factors.user.organizationId,
          },
      loginSettings?.defaultRedirectUri
    );

    if ("error" in callbackResponse) {
      return {
        validationErrors: undefined,
        formData: { code },
        error: callbackResponse.error,
      };
    }

    if ("redirect" in callbackResponse) {
      return {
        validationErrors: undefined,
        error: undefined,
        formData: { code },
        redirect: callbackResponse.redirect,
      };
    }
  }

  return {
    validationErrors: undefined,
    error: undefined,
    formData: { code },
  };
}

async function _submitOTPCode(
  values: Inputs,
  params: SubmitCodeParams
): Promise<SessionResponse | undefined> {
  const { loginName, sessionId, organization, requestId, method } = params;

  let checks;

  if (method === "email") {
    checks = create(ChecksSchema, {
      otpEmail: { code: values.code },
    });
  }
  if (method === "time-based") {
    checks = create(ChecksSchema, {
      totp: { code: values.code },
    });
  }

  try {
    const response = await updateSession({
      loginName,
      sessionId,
      organization,
      checks,
      requestId,
    });

    if (response && "error" in response && response.error) {
      return { error: response.error };
    }

    return response;
  } catch {
    return { error: "Could not verify OTP code" };
  }
}
