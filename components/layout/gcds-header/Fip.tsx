/*--------------------------------------------*
 * Internal Aliases
 *--------------------------------------------*/
import { serverTranslation } from "@i18n/server";

/*--------------------------------------------*
 * Local Relative
 *--------------------------------------------*/
import { SignatureEn } from "./assets/SignatureEn";
import { SignatureFr } from "./assets/SignatureFr";
export const Fip = async ({ language }: { language: string }) => {
  const { t } = await serverTranslation(["fip"]);

  const link = t("fip.link", { lng: language });

  return (
    <div className="gcds-signature brand__signature">
      <a href={link}>{language === "fr" ? <SignatureFr /> : <SignatureEn />}</a>
    </div>
  );
};
