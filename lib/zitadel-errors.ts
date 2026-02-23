import { ConnectError } from "@connectrpc/connect";
import { ErrorDetailSchema } from "@zitadel/proto/zitadel/message_pb";

export type ZitadelErrorContext = "otp.set";

export type ZitadelUiError = {
  namespace: string;
  i18nKey: string;
  blockContinue?: boolean;
};

function getFirstErrorDetail(err: ConnectError) {
  return err.findDetails(ErrorDetailSchema)[0];
}

function getErrorDetailFields(detail: unknown): { id?: string; message?: string } {
  if (!detail || typeof detail !== "object") {
    return {};
  }

  const candidate = detail as { id?: string; message?: string };
  return {
    id: candidate.id,
    message: candidate.message,
  };
}

function isOtpAlreadyReadyError(err: ConnectError): boolean {
  const detail = getErrorDetailFields(getFirstErrorDetail(err));
  const normalizedMessage =
    `${detail.message ?? ""} ${err.rawMessage ?? ""} ${err.message ?? ""}`.toLowerCase();

  return err.code === 6 || normalizedMessage.includes("already set up");
}

export function getZitadelUiError(
  context: ZitadelErrorContext,
  err: unknown
): ZitadelUiError | undefined {
  if (!(err instanceof ConnectError)) {
    return undefined;
  }

  if (context === "otp.set" && isOtpAlreadyReadyError(err)) {
    return {
      namespace: "otp",
      i18nKey: "set.alreadySetUp",
      blockContinue: true,
    };
  }

  return undefined;
}
