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

type Props = {
  loginName?: string;
  sessionId: string;
  sessionToken?: string;
  requestId?: string;
  organization?: string;
  checkAfter: boolean;
  loginSettings?: LoginSettings;
};

export function RegisterU2f({
  loginName,
  sessionId,
  sessionToken,
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
    publicKeyCredential: any,
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
    console.log("Starting U2F registration...");
    const response = await addU2F({
      sessionId,
    })
      .catch((err) => {
        console.error("addU2F error:", err);
        console.error("Error details:", err.message, err.stack);
        setError("An error on registering passkey: " + err.message);
        return;
      })
      .finally(() => {
        setLoading(false);
      });

    console.log("addU2F response:", response);

    if (response && "error" in response && response?.error) {
      console.error("Got error in response:", response?.error);
      setError(response?.error);
      return;
    }

    if (!response || !("u2fId" in response)) {
      console.error("No u2fId in response:", response);
      setError("An error on registering passkey");
      return;
    }

    console.log("Got u2fId, prompting for credentials...");

    const u2fResponse = response as unknown as RegisterU2FResponse;

    const u2fId = u2fResponse.u2fId;

    // The publicKeyCredentialCreationOptions is a structpb.Struct
    // We need to extract the actual object from it
    console.log("Raw options:", u2fResponse.publicKeyCredentialCreationOptions);
    console.log("Options type:", typeof u2fResponse.publicKeyCredentialCreationOptions);

    let credentialOptions: any = u2fResponse.publicKeyCredentialCreationOptions;

    // Try to convert protobuf Struct to plain object
    try {
      // Use JSON serialization to get a plain object
      credentialOptions = JSON.parse(JSON.stringify(credentialOptions));
      console.log("Converted via JSON:", credentialOptions);
    } catch (e) {
      console.error("Failed to convert options:", e);
    }

    if (!credentialOptions || !credentialOptions.publicKey) {
      console.error("No valid publicKey in options:", credentialOptions);
      setError("Invalid credential options received");
      return;
    }

    const options: CredentialCreationOptions = { publicKey: credentialOptions.publicKey };
    console.log("Final options for navigator.credentials.create:", options);
    console.log("Challenge:", options.publicKey?.challenge);
    console.log("User ID:", options.publicKey?.user);
    console.log("Authenticator selection:", options.publicKey?.authenticatorSelection);

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

      console.log("Updated authenticator selection:", options.publicKey.authenticatorSelection);
      console.log("Attestation:", options.publicKey.attestation);
      console.log("Converting challenge and user ID to ArrayBuffer...");

      console.log(
        "Challenge before conversion:",
        options.publicKey.challenge,
        typeof options.publicKey.challenge
      );
      console.log(
        "User ID before conversion:",
        options.publicKey.user.id,
        typeof options.publicKey.user.id
      );

      options.publicKey.challenge = coerceToArrayBuffer(options.publicKey.challenge, "challenge");
      options.publicKey.user.id = coerceToArrayBuffer(options.publicKey.user.id, "userid");

      console.log("Challenge after conversion:", options.publicKey.challenge);
      console.log("User ID after conversion:", options.publicKey.user.id);

      if (options.publicKey.excludeCredentials) {
        options.publicKey.excludeCredentials.map((cred: any) => {
          cred.id = coerceToArrayBuffer(cred.id as string, "excludeCredentials.id");
          return cred;
        });
      }

      console.log(
        "Final complete options object:",
        JSON.stringify(
          {
            publicKey: {
              ...options.publicKey,
              challenge: "[ArrayBuffer]",
              user: {
                ...options.publicKey.user,
                id: "[ArrayBuffer]",
              },
            },
          },
          null,
          2
        )
      );

      console.log("Calling navigator.credentials.create...");
      let resp;
      try {
        // Add a timeout wrapper in case the call hangs
        const createPromise = window.navigator.credentials.create(options);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Credential creation timed out after 60s")), 60000)
        );

        resp = await Promise.race([createPromise, timeoutPromise]);
        console.log("Got credential response:", resp);
        console.log("Response type:", typeof resp);
        console.log(
          "Response has attestationObject:",
          !!(resp as any)?.response?.attestationObject
        );
      } catch (credError) {
        console.error("navigator.credentials.create error:", credError);
        setError("Failed to create credentials: " + (credError as Error).message);
        setLoading(false);
        return;
      }

      if (
        !resp ||
        !(resp as any).response.attestationObject ||
        !(resp as any).response.clientDataJSON ||
        !(resp as any).rawId
      ) {
        setError("An error on registering passkey");
        return;
      }

      const attestationObject = (resp as any).response.attestationObject;
      const clientDataJSON = (resp as any).response.clientDataJSON;
      const rawId = (resp as any).rawId;

      console.log("Converting response data to base64...");
      const data = {
        id: resp.id,
        rawId: coerceToBase64Url(rawId, "rawId"),
        type: resp.type,
        response: {
          attestationObject: coerceToBase64Url(attestationObject, "attestationObject"),
          clientDataJSON: coerceToBase64Url(clientDataJSON, "clientDataJSON"),
        },
      };

      console.log("Calling submitVerify with u2fId:", u2fId);
      const submitResponse = await submitVerify(u2fId, "", data, sessionId);
      console.log("submitVerify response:", submitResponse);

      if (!submitResponse) {
        setError("An error on verifying passkey");
        setLoading(false);
        return;
      }

      console.log("Verification successful! Processing redirect...");
      console.log("checkAfter:", checkAfter);
      console.log("requestId:", requestId);
      console.log("sessionId:", sessionId);
      console.log("loginName:", loginName);

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

        console.log("Redirecting to /u2f with params:", paramsToContinue.toString());
        return router.push(`/u2f?` + paramsToContinue);
      } else {
        console.log("No checkAfter, processing completion flow...");
        if (requestId && sessionId) {
          console.log("Has requestId and sessionId, calling completeFlowOrGetUrl...");
          const callbackResponse = await completeFlowOrGetUrl(
            {
              sessionId: sessionId,
              requestId: requestId,
              organization: organization,
            },
            loginSettings?.defaultRedirectUri
          );

          console.log("completeFlowOrGetUrl response:", callbackResponse);

          if ("error" in callbackResponse) {
            setError(callbackResponse.error);
            setLoading(false);
            return;
          }

          if ("redirect" in callbackResponse) {
            console.log("Redirecting to:", callbackResponse.redirect);
            return router.push(callbackResponse.redirect);
          }
        } else if (loginName) {
          console.log("Has loginName, calling completeFlowOrGetUrl...");
          const callbackResponse = await completeFlowOrGetUrl(
            {
              loginName: loginName,
              organization: organization,
            },
            loginSettings?.defaultRedirectUri
          );

          console.log("completeFlowOrGetUrl response:", callbackResponse);

          if ("error" in callbackResponse) {
            setError(callbackResponse.error);
            return;
          }

          if ("redirect" in callbackResponse) {
            return router.push(callbackResponse.redirect);
          }
        } else {
          // No requestId or loginName - redirect to accounts page as fallback
          console.log("No requestId or loginName, redirecting to accounts page...");
          setLoading(false);
          return router.push("/accounts");
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

      <div className="py-4">
        <p className="text-sm">
          <I18n i18nKey="set.registerInstructions" namespace="u2f" />
        </p>
      </div>

      <div className="mt-8 flex w-full flex-row items-center">
        <BackButton data-testid="back-button" />

        <span className="flex-grow"></span>
        <SubmitButton
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
