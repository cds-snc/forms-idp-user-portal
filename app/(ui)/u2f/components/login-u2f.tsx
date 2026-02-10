"use client";

import { coerceToArrayBuffer, coerceToBase64Url } from "@lib/utils/base64";
import { verifyU2FLogin } from "@lib/server/u2f";
import { updateSession } from "@lib/server/session";
import { create, JsonObject } from "@zitadel/client";
import {
  RequestChallengesSchema,
  UserVerificationRequirement,
} from "@zitadel/proto/zitadel/session/v2/challenge_pb";
import { Checks } from "@zitadel/proto/zitadel/session/v2/session_service_pb";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslation, I18n } from "@i18n";

import { BackButton } from "@clientComponents/globals/Buttons/BackButton";
import { Alert, ErrorStatus } from "@clientComponents/forms";
import { SubmitButton, Button } from "@clientComponents/globals/Buttons";

type PublicKeyCredentialRequestOptionsData = {
  challenge: BufferSource | string;
  timeout?: number;
  rpId?: string;
  allowCredentials?: PublicKeyCredentialDescriptor[];
  userVerification?: "required" | "preferred" | "discouraged";
  [key: string]: unknown;
};

// either loginName or sessionId must be provided
type Props = {
  loginName?: string;
  sessionId?: string;
  requestId?: string;
  altPassword: boolean;
  login?: boolean;
  organization?: string;
  redirect?: string | null;
};

export function LoginU2F({
  loginName,
  sessionId,
  requestId,
  altPassword,
  organization,
  login = true,
  redirect,
}: Props) {
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const { t } = useTranslation("u2f");
  const router = useRouter();

  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      setLoading(true);
      updateSessionForChallenge()
        .then((response) => {
          const pK = response?.challenges?.webAuthN?.publicKeyCredentialRequestOptions?.publicKey;

          if (!pK) {
            setError(t("verify.errors.couldNotRequestChallenge"));
            setLoading(false);
            return;
          }

          return submitLoginAndContinue(pK as PublicKeyCredentialRequestOptionsData)
            .catch((error) => {
              setError(error);
              return;
            })
            .finally(() => {
              setLoading(false);
            });
        })
        .catch((error) => {
          setError(error);
          return;
        })
        .finally(() => {
          setLoading(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateSessionForChallenge(
    userVerificationRequirement: number = login
      ? UserVerificationRequirement.REQUIRED
      : UserVerificationRequirement.DISCOURAGED
  ) {
    setError("");
    setLoading(true);
    const session = await updateSession({
      loginName,
      sessionId,
      organization,
      challenges: create(RequestChallengesSchema, {
        webAuthN: {
          domain: "",
          userVerificationRequirement,
        },
      }),
      requestId,
    })
      .catch(() => {
        setError(t("verify.errors.couldNotRequestChallenge"));
        return;
      })
      .finally(() => {
        setLoading(false);
      });

    if (session && "error" in session && session.error) {
      setError(session.error);
      return;
    }

    return session;
  }

  async function submitLogin(data: JsonObject) {
    setLoading(true);
    const response = await verifyU2FLogin({
      loginName,
      sessionId,
      organization,
      checks: {
        webAuthN: { credentialAssertionData: data },
      } as Checks,
      requestId,
      redirect,
    })
      .catch(() => {
        setError(t("verify.errors.couldNotVerifyPasskey"));
        return;
      })
      .finally(() => {
        setLoading(false);
      });

    if (response && "error" in response && response.error) {
      setError(response.error);
      return;
    }

    if (response && "redirect" in response && response.redirect) {
      return router.push(response.redirect);
    }

    // If we got here, something went wrong - no redirect or error was returned
    if (!response) {
      setError(t("verify.errors.noResponseReceived"));
    } else {
      setError(t("verify.errors.noRedirectProvided"));
    }
  }

  async function submitLoginAndContinue(
    publicKey: PublicKeyCredentialRequestOptionsData
  ): Promise<boolean | void> {
    publicKey.challenge = coerceToArrayBuffer(publicKey.challenge, "publicKey.challenge");
    if (publicKey.allowCredentials) {
      publicKey.allowCredentials.map((listItem: PublicKeyCredentialDescriptor) => {
        listItem.id = coerceToArrayBuffer(listItem.id, "publicKey.allowCredentials.id");
        // Only allow hardware key transports (USB, NFC, BLE) - excludes platform/internal transports
        listItem.transports = ["usb", "ble", "nfc"] as AuthenticatorTransport[];
      });
    }

    return navigator.credentials
      .get({
        publicKey,
      } as CredentialRequestOptions)
      .then((credential: Credential | null) => {
        if (!credential) {
          setError(t("verify.errors.couldNotRetrievePasskey"));
          return;
        }

        const assertedCredential = credential as PublicKeyCredential;
        const assertionResponse = assertedCredential.response as AuthenticatorAssertionResponse;
        const authData = new Uint8Array(assertionResponse.authenticatorData);
        const clientDataJSON = new Uint8Array(assertionResponse.clientDataJSON);
        const rawId = new Uint8Array(assertedCredential.rawId);
        const sig = new Uint8Array(assertionResponse.signature);
        const userHandle = new Uint8Array(assertionResponse.userHandle || []);
        const data = {
          id: assertedCredential.id,
          rawId: coerceToBase64Url(rawId, "rawId"),
          type: assertedCredential.type,
          response: {
            authenticatorData: coerceToBase64Url(authData, "authData"),
            clientDataJSON: coerceToBase64Url(clientDataJSON, "clientDataJSON"),
            signature: coerceToBase64Url(sig, "sig"),
            userHandle: coerceToBase64Url(userHandle, "userHandle"),
          },
        };

        return submitLogin(data);
      })
      .catch((error: Error) => {
        // Handle U2F verification cancellation or errors
        if (error?.name === "NotAllowedError") {
          setError(t("verify.errors.verificationCancelled"));
        } else {
          setError(t("verify.errors.verificationFailed"));
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <div className="w-full">
      {error && (
        <div className="py-4">
          <Alert type={ErrorStatus.ERROR}>{error}</Alert>
        </div>
      )}
      <div className="mt-8 flex w-full flex-row items-center">
        {altPassword ? (
          <Button
            type="button"
            theme="secondary"
            onClick={() => {
              const params = new URLSearchParams();

              if (loginName) {
                params.append("loginName", loginName);
              }

              if (sessionId) {
                params.append("sessionId", sessionId);
              }

              if (requestId) {
                params.append("requestId", requestId);
              }

              if (organization) {
                params.append("organization", organization);
              }

              return router.push(
                "/password?" + params // alt is set because password is requested as alternative auth method, so passwordless prompt can be escaped
              );
            }}
            data-testid="password-button"
          >
            <I18n i18nKey="verify.usePassword" namespace="u2f" />
          </Button>
        ) : (
          <BackButton />
        )}

        <span className="grow"></span>
        <SubmitButton
          type="submit"
          loading={loading}
          onClick={async () => {
            const response = await updateSessionForChallenge().finally(() => {
              setLoading(false);
            });

            const pK = response?.challenges?.webAuthN?.publicKeyCredentialRequestOptions?.publicKey;

            if (!pK) {
              setError(t("verify.errors.couldNotRequestChallenge"));
              return;
            }

            setLoading(true);

            return submitLoginAndContinue(pK as PublicKeyCredentialRequestOptionsData)
              .catch((error) => {
                setError(error);
                return;
              })
              .finally(() => {
                setLoading(false);
              });
          }}
          data-testid="submit-button"
        >
          <I18n i18nKey="verify.submit" namespace="u2f" />
        </SubmitButton>
      </div>
    </div>
  );
}
