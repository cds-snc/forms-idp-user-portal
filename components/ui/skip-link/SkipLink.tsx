"use client";

/*--------------------------------------------*
 * Framework and Third-Party
 *--------------------------------------------*/
import Link from "next/link";

/*--------------------------------------------*
 * Internal Aliases
 *--------------------------------------------*/
import { useTranslation } from "@i18n/client";
export const SkipLink = () => {
  const { t } = useTranslation("layout");

  return (
    <div id="skip-link-container">
      <Link href="#content" id="skip-link" prefetch={false}>
        {t("skip-link")}
      </Link>
    </div>
  );
};
