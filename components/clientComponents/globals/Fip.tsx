"use client";
import Link from "next/link";
import { useTranslation } from "@i18n";
import Image from "next/image";

export const Fip = () => {
  const {
    t,
    i18n: { language },
  } = useTranslation("fip");
  return (
    <div className="canada-flag">
      <Link href={t("link")} aria-label={t("text")}>
        <Image src={`/img/sig-blk-${language}.svg`} alt={t("text")} className={"max-h-[40px]"} />
      </Link>
    </div>
  );
};
