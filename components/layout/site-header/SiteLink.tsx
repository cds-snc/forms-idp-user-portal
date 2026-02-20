import { I18n } from "@i18n";
import Link from "next/link";

import { SiteLogo } from "@components/icons/SiteLogo";

export const SiteLink = ({ href }: { href: string }) => {
  return (
    <Link
      href={href}
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
  );
};
