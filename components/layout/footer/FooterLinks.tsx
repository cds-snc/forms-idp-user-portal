"use client";

/*--------------------------------------------*
 * Internal Aliases
 *--------------------------------------------*/
import { I18n } from "@i18n";
import { useTranslation } from "@i18n/client";
const FORMS_PRODUCTION_URL = process.env.NEXT_PUBLIC_FORMS_PRODUCTION_URL || "";

const BulletPoint = () => {
  return <span className="px-3">&#x2022;</span>;
};

export const FooterLinks = () => {
  const { i18n } = useTranslation();
  const locale = i18n.language;

  return (
    <span className="mr-10 inline-block">
      <a
        className="whitespace-nowrap"
        href={`${FORMS_PRODUCTION_URL}/${locale}/about`}
        target="_blank"
      >
        <I18n i18nKey="about.desc" namespace="footer" />
      </a>
      <BulletPoint />
      <a className="whitespace-nowrap" href={`${FORMS_PRODUCTION_URL}/${locale}/terms-of-use`}>
        <I18n i18nKey="terms-of-use.desc" namespace="footer" />
      </a>
      <BulletPoint />
      <a className="whitespace-nowrap" href={`${FORMS_PRODUCTION_URL}/${locale}/sla`}>
        <I18n i18nKey="sla.desc" namespace="footer" />
      </a>
    </span>
  );
};
