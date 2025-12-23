"use client";

import { coerceToArrayBuffer, coerceToBase64Url } from "@lib/utils";
import { registerPasskeyLink, verifyPasskeyRegistration } from "@lib/server/passkeys";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useCallback } from "react";

import { BackButton } from "@clientComponents/globals/Buttons";
import { Alert, ErrorStatus } from "@clientComponents/forms";
import { SubmitButtonAction, Button } from "@clientComponents/globals/Buttons";
import { I18n } from "@i18n";

type FormState = {
  error?: string;
};

type Props = {
  sessionId?: string;
  userId?: string;
  isPrompt: boolean;
  requestId?: string;
  organization?: string;
  code?: string;
  codeId?: string;
};

export function RegisterPasskey({
  sessionId,
  userId,
  isPrompt,
  organization,
  requestId,
  code,
  codeId,
}: Props) {
  const router = useRouter();

  async function submitVerify(
    passkeyId: string,
    passkeyName: string,
    publicKeyCredential: any,
    currentSessionId?: string,
    currentUserId?: string
  ) {
    const response = await verifyPasskeyRegistration({
      passkeyId,
      passkeyName,
      publicKeyCredential,
      sessionId: currentSessionId,
      userId: currentUserId,
    }).catch(() => {
      return {
        error: "Could not verify Passkey",
      };
    });

    return response;
  }

  const localFormAction = useCallback(
    async (previousState: FormState) => {
      // Require either sessionId or userId
      if (!sessionId && !userId) {
        return {
          error: "Missing session or user information",
        };
      }

      let regReq;

      if (sessionId) {
        regReq = { sessionId };
      } else if (userId && code && codeId) {
        regReq = { userId, code, codeId };
      } else {
        return {
          error: "Missing code for user-based registration",
        };
      }

      const resp = await registerPasskeyLink(regReq).catch(() => {
        return {
          error: "Could not register passkey",
        };
      });

      if (!resp) {
        return {
          error: "An error on registering passkey",
        };
      }

      if ("error" in resp && resp.error) {
        return {
          error: resp.error,
        };
      }

      if (!("passkeyId" in resp)) {
        return {
          error: "An error on registering passkey",
        };
      }

      const passkeyId = resp.passkeyId;
      const options: CredentialCreationOptions =
        (resp.publicKeyCredentialCreationOptions as CredentialCreationOptions) ?? {};

      if (!options.publicKey) {
        return {
          error: "An error on registering passkey",
        };
      }

      options.publicKey.challenge = coerceToArrayBuffer(options.publicKey.challenge, "challenge");
      options.publicKey.user.id = coerceToArrayBuffer(options.publicKey.user.id, "userid");
      if (options.publicKey.excludeCredentials) {
        options.publicKey.excludeCredentials.map((cred: any) => {
          cred.id = coerceToArrayBuffer(cred.id as string, "excludeCredentials.id");
          return cred;
        });
      }

      const credentials = await navigator.credentials.create(options);

      if (
        !credentials ||
        !(credentials as any).response?.attestationObject ||
        !(credentials as any).response?.clientDataJSON ||
        !(credentials as any).rawId
      ) {
        return {
          error: "An error on registering passkey",
        };
      }

      const attestationObject = (credentials as any).response.attestationObject;
      const clientDataJSON = (credentials as any).response.clientDataJSON;
      const rawId = (credentials as any).rawId;

      const data = {
        id: credentials.id,
        rawId: coerceToBase64Url(rawId, "rawId"),
        type: credentials.type,
        response: {
          attestationObject: coerceToBase64Url(attestationObject, "attestationObject"),
          clientDataJSON: coerceToBase64Url(clientDataJSON, "clientDataJSON"),
        },
      };

      const verificationResponse = await submitVerify(passkeyId, "", data, sessionId, userId);

      if (!verificationResponse) {
        return {
          error: "Could not verify Passkey!",
        };
      }

      continueAndLogin();
      return previousState;
    },
    [sessionId, userId, code]
  );

  const [state, formAction] = useActionState(localFormAction, {});

  // Auto-submit when code is provided (similar to VerifyForm)
  useEffect(() => {
    if (code) {
      localFormAction({});
    }
  }, [code, localFormAction]);

  function continueAndLogin() {
    const params = new URLSearchParams();

    if (organization) {
      params.set("organization", organization);
    }

    if (requestId) {
      params.set("requestId", requestId);
    }

    if (sessionId) {
      params.set("sessionId", sessionId);
    }

    if (userId) {
      params.set("userId", userId);
    }

    router.push("/passkey?" + params);
  }

  return (
    <form className="w-full">
      {state.error && (
        <div className="py-4">
          <Alert type={ErrorStatus.ERROR}>{state.error}</Alert>
        </div>
      )}

      <div className="mt-8 flex w-full flex-row items-center">
        {isPrompt ? (
          <Button
            type="button"
            theme="secondary"
            onClick={() => {
              continueAndLogin();
            }}
          >
            <I18n i18nKey="set.skip" namespace="passkey" />
          </Button>
        ) : (
          <BackButton />
        )}

        <span className="flex-grow"></span>
        <SubmitButtonAction type="submit">
          <I18n i18nKey="set.submit" namespace="passkey" />
        </SubmitButtonAction>
      </div>
    </form>
  );
}
