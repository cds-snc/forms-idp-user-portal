"use client";

import { coerceToArrayBuffer, coerceToBase64Url } from "@lib/utils/base64";
import { completeFlowOrGetUrl } from "@lib/client";
import { addU2F, verifyU2F } from "@lib/server/u2f";
import { LoginSettings } from "@zitadel/proto/zitadel/settings/v2/login_settings_pb";
import { RegisterU2FResponse } from "@zitadel/proto/zitadel/user/v2/user_service_pb";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BackButton } from "@clientComponents/globals/Buttons/BackButton";
import { Alert, ErrorStatus } from "@clientComponents/forms";
import { SubmitButton } from "@clientComponents/globals/Buttons";
import { I18n } from "@i18n";

type PublicKeyCredentialJSON = {
  id: string | ArrayBuffer;
  rawId: string;
  type: string;
  response: {
    attestationObject: string;
    clientDataJSON: string;
  };
};

type CredentialOptionsData =
  | {
      publicKey?: PublicKeyCredentialCreationOptions;
      [key: string]: unknown;
    }
  | undefined;

type Props = {
  loginName?: string;
  sessionId: string;
  requestId?: string;
  organization?: string;
  checkAfter: boolean;
  loginSettings?: LoginSettings;
};

export function RegisterU2f({
  loginName,
  sessionId,
  organization,
  requestId,
  checkAfter,
  loginSettings,
}: Props) {
  const [error, setError] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);

  const router = useRouter();

  async function submitVerify(
    u2fId: string,
    passkeyName: string,
    publicKeyCredential: PublicKeyCredentialJSON,
    sessionId: string
  ) {
    setError("");
    setLoading(true);
    const response = await verifyU2F({
      u2fId,
      passkeyName,
      publicKeyCredential,
      sessionId,
    })
      .catch(() => {
        setError("An error on verifying passkey occurred");
        return;
      })
      .finally(() => {
        setLoading(false);
      });

    if (response && "error" in response && response?.error) {
      setError(response?.error);
      return;
    }

    return response;
  }

  async function submitRegisterAndContinue(): Promise<boolean | void | null> {
    setError("");
    setLoading(true);
    const response = await addU2F({
      sessionId,
    })
      .catch((err) => {
        setError("An error on registering passkey: " + err.message);
        return;
      })
      .finally(() => {
        setLoading(false);
      });

    if (response && "error" in response && response?.error) {
      setError(response?.error);
      return;
    }

    if (!response || !("u2fId" in response)) {
      setError("An error on registering passkey");
      return;
    }

    const u2fResponse = response as unknown as RegisterU2FResponse;

    const u2fId = u2fResponse.u2fId;

    // The publicKeyCredentialCreationOptions is a structpb.Struct
    // We need to extract the actual object from it
    let credentialOptions: CredentialOptionsData = u2fResponse.publicKeyCredentialCreationOptions;

    // Try to convert protobuf Struct to plain object
    try {
      // Use JSON serialization to get a plain object
      credentialOptions = JSON.parse(JSON.stringify(credentialOptions));
    } catch (e) {
      // Handle error silently
    }

    if (!credentialOptions || !credentialOptions.publicKey) {
      setError("Invalid credential options received");
      return;
    }

    const options: CredentialCreationOptions = { publicKey: credentialOptions.publicKey };

    if (options.publicKey) {
      // Force U2F hardware key (not passkey)
      // These settings explicitly prevent passkey managers like 1Password from responding
      options.publicKey.authenticatorSelection = {
        authenticatorAttachment: "cross-platform" as AuthenticatorAttachment,
        residentKey: "discouraged" as ResidentKeyRequirement,
        requireResidentKey: false,
        userVerification: "discouraged" as UserVerificationRequirement,
      };

      // For U2F, we want direct attestation to prevent passkey prompts
      options.publicKey.attestation = "direct" as AttestationConveyancePreference;

      options.publicKey.challenge = coerceToArrayBuffer(options.publicKey.challenge, "challenge");
      options.publicKey.user.id = coerceToArrayBuffer(options.publicKey.user.id, "userid");

      if (options.publicKey.excludeCredentials) {
        options.publicKey.excludeCredentials.map((cred: PublicKeyCredentialDescriptor) => {
          cred.id = coerceToArrayBuffer(cred.id as unknown as string, "excludeCredentials.id");
          return cred;
        });
      }

      let resp: PublicKeyCredential | null;
      try {
        // Add a timeout wrapper in case the call hangs
        const createPromise = window.navigator.credentials.create(options);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Credential creation timed out after 60s")), 60000)
        );

        resp = (await Promise.race([createPromise, timeoutPromise])) as PublicKeyCredential;
      } catch (credError) {
        setError("Failed to create credentials: " + (credError as Error).message);
        setLoading(false);
        return;
      }

      if (
        !resp ||
        !("response" in resp) ||
        !("attestationObject" in resp.response) ||
        !("clientDataJSON" in resp.response) ||
        !("id" in resp)
      ) {
        setError("An error on registering passkey");
        return;
      }

      const attestationObject = (resp.response as AuthenticatorAttestationResponse)
        .attestationObject;
      const clientDataJSON = (resp.response as AuthenticatorAttestationResponse).clientDataJSON;
      const rawId = resp.id;

      const data = {
        id: resp.id,
        rawId: coerceToBase64Url(rawId, "rawId"),
        type: resp.type,
        response: {
          attestationObject: coerceToBase64Url(attestationObject, "attestationObject"),
          clientDataJSON: coerceToBase64Url(clientDataJSON, "clientDataJSON"),
        },
      };

      const submitResponse = await submitVerify(u2fId, "", data, sessionId);

      if (!submitResponse) {
        setError("An error on verifying passkey");
        setLoading(false);
        return;
      }

      if (checkAfter) {
        const paramsToContinue = new URLSearchParams({});

        if (sessionId) {
          paramsToContinue.append("sessionId", sessionId);
        }
        if (loginName) {
          paramsToContinue.append("loginName", loginName);
        }
        if (organization) {
          paramsToContinue.append("organization", organization);
        }
        if (requestId) {
          paramsToContinue.append("requestId", requestId);
        }

        return router.push(`/u2f?` + paramsToContinue);
      } else {
        if (requestId && sessionId) {
          const callbackResponse = await completeFlowOrGetUrl(
            {
              sessionId: sessionId,
              requestId: requestId,
              organization: organization,
            },
            loginSettings?.defaultRedirectUri
          );

          if ("error" in callbackResponse) {
            setError(callbackResponse.error);
            setLoading(false);
            return;
          }

          if ("redirect" in callbackResponse) {
            return router.push(callbackResponse.redirect);
          }
        } else if (loginName) {
          const callbackResponse = await completeFlowOrGetUrl(
            {
              loginName: loginName,
              organization: organization,
            },
            loginSettings?.defaultRedirectUri
          );

          if ("error" in callbackResponse) {
            setError(callbackResponse.error);
            return;
          }

          if ("redirect" in callbackResponse) {
            return router.push(callbackResponse.redirect);
          }
        } else {
          // No requestId or loginName - redirect to signed in page as fallback
          setLoading(false);
          return router.push("/signedin");
        }
      }
    }
  }

  return (
    <form className="w-full" onSubmit={(e) => e.preventDefault()}>
      {error && (
        <div className="py-4">
          <Alert type={ErrorStatus.ERROR}>{error}</Alert>
        </div>
      )}

      <div className="mt-8 flex w-full flex-row items-center">
        <BackButton data-testid="back-button" />
        <SubmitButton
          className="ml-4"
          type="button"
          loading={loading}
          disabled={loading}
          onClick={submitRegisterAndContinue}
          data-testid="submit-button"
        >
          <I18n i18nKey="set.submit" namespace="u2f" />
        </SubmitButton>
      </div>
    </form>
  );
}
