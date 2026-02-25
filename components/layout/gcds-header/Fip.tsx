"use client";

/*--------------------------------------------*
 * Internal Aliases
 *--------------------------------------------*/
import { useTranslation } from "@i18n";

/*--------------------------------------------*
 * Local Relative
 *--------------------------------------------*/
import { SignatureEn } from "./assets/SignatureEn";
import { SignatureFr } from "./assets/SignatureFr";
const normalizeLanguage = (language: string): "en" | "fr" => {
  if (language.toLowerCase().startsWith("fr")) {
    return "fr";
  }

  return "en";
};

export const Fip = ({ language }: { language: string }) => {
  const {
    t,
    i18n: { language: currentLanguage },
  } = useTranslation("fip");

  const normalizedLanguage = normalizeLanguage(currentLanguage || language);

  const link = t("link", { lng: normalizedLanguage });

  return (
    <div className="gcds-signature brand__signature">
      <a href={link}>{normalizedLanguage === "fr" ? <SignatureFr /> : <SignatureEn />}</a>
    </div>
  );
};
