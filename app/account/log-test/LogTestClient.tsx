"use client";

/*--------------------------------------------*
 * Framework and Third-Party
 *--------------------------------------------*/
import { useState, useTransition } from "react";

/*--------------------------------------------*
 * Local Relative
 *--------------------------------------------*/
import { triggerLog } from "./actions";

type LogButton = {
  id: "debug" | "info" | "warn" | "error" | "caught-exception";
  label: string;
};

const LOG_BUTTONS: LogButton[] = [
  { id: "debug", label: "Send debug log" },
  { id: "info", label: "Send info log" },
  { id: "warn", label: "Send warn log" },
  { id: "error", label: "Send error log" },
  { id: "caught-exception", label: "Send caught exception log" },
];

export function LogTestClient() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string>("");

  const runLogAction = (type: LogButton["id"]) => {
    startTransition(async () => {
      const response = await triggerLog(type);
      setResult(response.summary);
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-700">
        Temporary page for validating how each log type appears in CloudWatch.
      </p>

      <div className="grid gap-3 tablet:grid-cols-2">
        {LOG_BUTTONS.map((buttonConfig) => (
          <button
            key={buttonConfig.id}
            type="button"
            onClick={() => runLogAction(buttonConfig.id)}
            disabled={isPending}
            className="rounded-md border border-gcds-grayscale-300 bg-white px-4 py-2 text-left text-sm font-semibold hover:bg-gcds-grayscale-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {buttonConfig.label}
          </button>
        ))}
      </div>

      <div className="rounded-md border border-gcds-grayscale-300 bg-white p-4 text-sm">
        <strong>Last result:</strong> {result || "No log emitted yet"}
      </div>
    </div>
  );
}
