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
  code?: number;
  message?: string;
  rawMessage?: string;
  findDetails: (schema: unknown) => unknown[];
}): ZitadelParsedError {
  const detail = getErrorDetailFields(getFirstErrorDetail(err));
  const text = `${detail.message ?? ""} ${err.rawMessage ?? ""} ${err.message ?? ""}`.toLowerCase();

  return {
    code: err.code,
    text,
  };
}

export function getZitadelUiError(
  context: ZitadelErrorContext,
  err: unknown,
  rulesByContext: ZitadelErrorRulesByContext = defaultRulesByContext
): ZitadelUiError | undefined {
  if (!isConnectErrorLike(err)) {
    return undefined;
  }

  const rules = rulesByContext[context] ?? [];
  const parsedError = parseZitadelError(err);

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
