"use client";

import { cn } from "@lib/utils";
import { SiteLink } from "./SiteLink";

export const SiteHeader = ({ children }: { children?: React.ReactNode }) => {
  return (
    <>
      <header className={cn("mb-5 border-b-1 border-gray-500 bg-white px-0")}>
        <div className="grid w-full grid-flow-col p-2">
          <SiteLink href="/" />
          <div className="flex items-center justify-end gap-4">{children}</div>
        </div>
      </header>
    </>
  );
};
