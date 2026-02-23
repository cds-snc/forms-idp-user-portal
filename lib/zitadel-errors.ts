import { ErrorDetailSchema } from "@zitadel/proto/zitadel/message_pb";

export type ZitadelErrorContext = string;

export type ZitadelUiError = {
  i18nKey: string;
  blockContinue?: boolean;
};

type ZitadelParsedError = {
  code?: number;
  text: string;
};

type ZitadelUiErrorRule = {
  match: (error: ZitadelParsedError) => boolean;
  i18nKey: string;
  blockContinue?: boolean;
};

type ZitadelErrorRulesByContext = Record<ZitadelErrorContext, ZitadelUiErrorRule[]>;

const defaultRulesByContext: ZitadelErrorRulesByContext = {
  "otp.set": [
    {
      match: (error) => error.code === 3 || error.text.includes("invalid code"),
      i18nKey: "set.invalidCode",
      blockContinue: true,
    },
    {
      match: (error) => error.code === 6 || error.text.includes("already set up"),
      i18nKey: "set.alreadySetUp",
      blockContinue: true,
    },
  ],
};

function isConnectErrorLike(err: unknown): err is {
  code?: number;
  message?: string;
  rawMessage?: string;
  findDetails: (schema: unknown) => unknown[];
} {
  if (!err || typeof err !== "object") {
    return false;
  }

  const candidate = err as { findDetails?: unknown };
  return typeof candidate.findDetails === "function";
}

function getFirstErrorDetail(err: { findDetails: (schema: unknown) => unknown[] }) {
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

function parseZitadelError(err: {
  code?: unknown;
  message?: unknown;
  rawMessage?: unknown;
}): ZitadelParsedError {
  const code = typeof err.code === "number" ? err.code : undefined;
  const message = typeof err.message === "string" ? err.message : "";
  const rawMessage = typeof err.rawMessage === "string" ? err.rawMessage : "";

  const detailMessage =
    isConnectErrorLike(err) && getFirstErrorDetail(err)
      ? (getErrorDetailFields(getFirstErrorDetail(err)).message ?? "")
      : "";

  const text = `${detailMessage} ${rawMessage} ${message}`.toLowerCase();

  return {
    code,
    text,
  };
}

export function getZitadelUiError(
  context: ZitadelErrorContext,
  err: unknown,
  rulesByContext: ZitadelErrorRulesByContext = defaultRulesByContext
): ZitadelUiError | undefined {
  if (!err || typeof err !== "object") {
    return undefined;
  }

  const rules = rulesByContext[context] ?? [];
  const parsedError = parseZitadelError(
    err as {
      code?: unknown;
      message?: unknown;
      rawMessage?: unknown;
    }
  );

  for (const rule of rules) {
    if (rule.match(parsedError)) {
      return {
        i18nKey: rule.i18nKey,
        blockContinue: rule.blockContinue,
      };
    }
  }

  return undefined;
}
