"use client";

import { CopyIcon, CheckIcon } from "@serverComponents/icons";
import copy from "copy-to-clipboard";
import { useEffect, useState } from "react";

type Props = {
  value: string;
};

export function CopyToClipboard({ value }: Props) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      copy(value);
      const to = setTimeout(setCopied, 1000, false);
      return () => clearTimeout(to);
    }
  }, [copied, value]);

  return (
    <div className="flex flex-row items-center px-2">
      <button id="tooltip-ctc" type="button" onClick={() => setCopied(true)}>
        {!copied ? <CopyIcon className="size-5" /> : <CheckIcon className="size-5" />}
      </button>
    </div>
  );
}
