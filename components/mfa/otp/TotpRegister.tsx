"use client";

import { completeFlowOrGetUrl } from "@lib/client";
import { verifyTOTP } from "@lib/server/verify";
import { LoginSettings } from "@zitadel/proto/zitadel/settings/v2/login_settings_pb";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation, I18n } from "@i18n";
import { useActionState } from "react";

import { CopyToClipboard } from "./CopyToClipboard";

import { Alert, ErrorStatus, Label, TextInput } from "@clientComponents/forms";
import { SubmitButtonAction } from "@clientComponents/globals/Buttons/SubmitButton";

type FormState = {
  error?: string;
};

type Props = {
  uri: string;
  secret: string;
  loginName?: string;
  sessionId?: string;
  requestId?: string;
  organization?: string;
  checkAfter?: boolean;
  loginSettings?: LoginSettings;
};
export function TotpRegister({
  uri,
  loginName,
  sessionId,
  requestId,
  organization,
  checkAfter,
  loginSettings,
}: Props) {
  const router = useRouter();

  const { t } = useTranslation("otp");

  const localFormAction = async (previousState: FormState, formData?: FormData) => {
    const code = formData?.get("code");

    if (typeof code !== "string") {
      return {
        error: "Invalid Field",
      };
    }

    return verifyTOTP(code, loginName, organization)
      .then(async () => {
        // if attribute is set, validate MFA after it is setup, otherwise proceed as usual (when mfa is enforced to login)
        if (checkAfter) {
          const params = new URLSearchParams({});

          if (loginName) {
            params.append("loginName", loginName);
          }
          if (requestId) {
            params.append("requestId", requestId);
          }
          if (organization) {
            params.append("organization", organization);
          }

          return router.push(`/otp/time-based?` + params);
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
              return {
                error: callbackResponse.error,
              };
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
              return {
                error: callbackResponse.error,
              };
            }

            if ("redirect" in callbackResponse) {
              return router.push(callbackResponse.redirect);
            }
          }
        }
      })
      .then(() => {
        return previousState;
      })
      .catch((e) => {
        if (e instanceof Error) {
          return {
            error: e.message,
          };
        } else {
          throw e;
        }
      });
  };
  const [state, formAction] = useActionState(localFormAction, {});

  return (
    <div className="flex flex-col items-center">
      {uri && (
        <>
          <QRCodeSVG className="my-4 size-40 rounded-md bg-white p-2" value={uri} />
          <div className="my-2 mb-4 flex w-96 rounded-lg border px-4 py-2 pr-2 text-sm">
            <Link href={uri} target="_blank" className="flex-1 overflow-x-auto">
              {uri}
            </Link>
            <CopyToClipboard value={uri}></CopyToClipboard>
          </div>
          <form className="w-full" action={formAction}>
            <div className="gcds-input-wrapper">
              <Label id={"label-code"} htmlFor={"code"} className="required" required>
                {t("set.labels.code")}
              </Label>
              <TextInput type={"text"} id={"code"} required defaultValue={""} />
            </div>

            {state.error && (
              <div className="py-4">
                <Alert type={ErrorStatus.ERROR}>{state.error}</Alert>
              </div>
            )}

            <SubmitButtonAction>
              <I18n i18nKey="set.submit" namespace="otp" />
            </SubmitButtonAction>
          </form>
        </>
      )}
    </div>
  );
}
