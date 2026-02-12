"use client";
import Link from "next/link";
import { cn } from "@lib/utils";
import { SiteLogo } from "@serverComponents/icons";
import { I18n } from "@i18n";

export const GcFormsHeader = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <header className={cn("mb-5 border-b-1 border-gray-500 bg-white px-0")}>
        <div className="grid w-full grid-flow-col p-2">
          <Link
            href={"/"}
            prefetch={false}
            id="logo"
            className="flex items-center no-underline focus:bg-white"
          >
            <span className="inline-block">
              <SiteLogo />
            </span>
            <span className="ml-3 inline-block text-[24px] font-semibold leading-10 text-[#1B00C2]">
              <I18n i18nKey="title" namespace="common" />
            </span>
          </Link>
          {children}
        </div>
      </header>
    </>
  );
};
