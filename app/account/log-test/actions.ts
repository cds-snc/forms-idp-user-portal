"use server";

/*--------------------------------------------*
 * Internal Aliases
 *--------------------------------------------*/
import { logMessage } from "@lib/logger";

type LogType = "debug" | "info" | "warn" | "error" | "caught-exception";

export async function triggerLog(type: LogType): Promise<{ ok: true; summary: string }> {
  const timestamp = new Date().toISOString();

  switch (type) {
    case "debug": {
      logMessage.debug({
        message: "CloudWatch log test: debug event",
        category: "cloudwatch-log-test",
        timestamp,
      });
      return { ok: true, summary: `Debug log emitted at ${timestamp}` };
    }

    case "info": {
      logMessage.info(`CloudWatch log test: info event at ${timestamp}`);
      return { ok: true, summary: `Info log emitted at ${timestamp}` };
    }

    case "warn": {
      logMessage.warn(`CloudWatch log test: warn event at ${timestamp}`);
      return { ok: true, summary: `Warn log emitted at ${timestamp}` };
    }

    case "error": {
      logMessage.error({
        message: "CloudWatch log test: error event",
        category: "cloudwatch-log-test",
        timestamp,
      });
      return { ok: true, summary: `Error log emitted at ${timestamp}` };
    }

    case "caught-exception": {
      try {
        throw new Error("CloudWatch log test: simulated exception");
      } catch (error) {
        logMessage.error(error);
      }

      return { ok: true, summary: `Caught-exception log emitted at ${timestamp}` };
    }
  }
}
