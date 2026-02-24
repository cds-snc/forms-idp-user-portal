"use client";

/*--------------------------------------------*
 * Framework and Third-Party
 *--------------------------------------------*/
import { useActionState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

/*--------------------------------------------*
 * Internal Aliases
 *--------------------------------------------*/
import { getSafeErrorMessage } from "@lib/safeErrorMessage";
import { verifyTOTP } from "@lib/server/verify";
import { validateTotpCode } from "@lib/validationSchemas";
import { getZitadelUiError } from "@lib/zitadel-errors";
import { I18n, useTranslation } from "@i18n";
import { SubmitButtonAction } from "@components/ui/button/SubmitButton";
import { Alert, ErrorStatus, Label, TextInput } from "@components/ui/form";

/*--------------------------------------------*
 * Local Relative
 *--------------------------------------------*/
import { CopyToClipboard } from "./CopyToClipboard";
type FormState = {
  error?: string;
};

type Props = {
  uri: string;
  secret: string;
  loginName?: string;
  requestId?: string;
  organization?: string;
  checkAfter?: boolean;
};
export function TotpRegister({ uri, loginName, requestId, organization, checkAfter }: Props) {
  const router = useRouter();

  const { t } = useTranslation(["otp", "error"]);
  const genericErrorMessage = t("set.genericError");
  const invalidCodeMessage = t("set.invalidCode");
  const invalidCodeLengthMessage = t("set.invalidCodeLength");

  const localFormAction = async (previousState: FormState, formData?: FormData) => {
    const code = formData?.get("code");

    if (typeof code !== "string") {
      return {
        error: genericErrorMessage,
      };
    }

    const normalizedCode = code.trim();

    const totpValidationResult = await validateTotpCode({ code: normalizedCode });
    if (!totpValidationResult.success) {
      return {
        error: invalidCodeLengthMessage,
      };
    }

    return verifyTOTP(normalizedCode, loginName, organization)
      .then(async () => {
        // Redirect to all-set page after successful setup
        const params = new URLSearchParams({});
        if (requestId) {
          params.append("requestId", requestId);
        }
        if (checkAfter) {
          params.append("checkAfter", "true");
          params.append("method", "time-based");
          if (loginName) {
            params.append("loginName", loginName);
          }
          if (organization) {
            params.append("organization", organization);
          }
        }
        return router.push(`/all-set?` + params);
      })
      .then(() => {
        return previousState;
      })
      .catch((e) => {
        const mappedUiError = getZitadelUiError("otp.verify", e);
        if (mappedUiError) {
          return {
            error: t(mappedUiError.i18nKey),
          };
        }

        if (e instanceof Error) {
          return {
            error: genericErrorMessage,
          };
        } else {
          throw e;
        }
      });
  };
  const [state, formAction, isPending] = useActionState(localFormAction, {});

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
            {!isPending && state.error && (
              <div className="py-4">
                <Alert type={ErrorStatus.ERROR} focussable>
                  {getSafeErrorMessage({
                    error: state.error,
                    fallback: genericErrorMessage,
                    allowedMessages: [
                      genericErrorMessage,
                      invalidCodeMessage,
                      invalidCodeLengthMessage,
                    ],
                  })}
                </Alert>
              </div>
            )}

            <div className="gcds-input-wrapper">
              <Label id={"label-code"} htmlFor={"code"} className="required" required>
                {t("set.labels.code")}
              </Label>
              <TextInput
                type={"text"}
                id={"code"}
                required
                defaultValue={""}
                autoComplete="one-time-code"
              />
            </div>

            <SubmitButtonAction>
              <I18n i18nKey="set.submit" namespace="otp" />
            </SubmitButtonAction>
          </form>
        </>
      )}
    </div>
  );
}
