"use client";
import Link from "next/link";
import { useTranslation } from "@i18n";

export const Fip = () => {
  const {
    t,
    i18n: { language },
  } = useTranslation("fip");
  return (
    <div className="canada-flag">
      <Link href={t("link")} aria-label={t("text")}>
        <picture>
          <img src={`/img/sig-blk-${language}.svg`} alt={t("text")} className={"max-h-[40px]"} />
        </picture>
      </Link>
    </div>
  );
};
