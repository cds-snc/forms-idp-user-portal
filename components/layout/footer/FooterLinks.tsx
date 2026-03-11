"use client";

/*--------------------------------------------*
 * Internal Aliases
 *--------------------------------------------*/
import { getSiteLink, SiteConfig } from "@lib/site-config";
import { I18n } from "@i18n";
import { useTranslation } from "@i18n/client";

const BulletPoint = () => {
  return <span className="px-3">&#x2022;</span>;
};

export const FooterLinks = ({ siteConfig }: { siteConfig: SiteConfig }) => {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const aboutLink = getSiteLink(siteConfig, "about", locale);
  const termsOfUseLink = getSiteLink(siteConfig, "termsOfUse", locale);
  const slaLink = getSiteLink(siteConfig, "sla", locale);

  if (!aboutLink && !termsOfUseLink && !slaLink) {
    return null; // Don't render the component if all links are missing
  }

  return (
    <span className="mr-10 inline-block">
      {aboutLink && (
        <>
          <a className="whitespace-nowrap" href={aboutLink} target="_blank">
            <I18n i18nKey="about.desc" namespace="footer" />
          </a>
          <BulletPoint />
        </>
      )}
      {termsOfUseLink && (
        <>
          <a className="whitespace-nowrap" href={termsOfUseLink} target="_blank">
            <I18n i18nKey="terms-of-use.desc" namespace="footer" />
          </a>
          <BulletPoint />
        </>
      )}
      {slaLink && (
        <>
          <a className="whitespace-nowrap" href={slaLink} target="_blank">
            <I18n i18nKey="sla.desc" namespace="footer" />
          </a>
        </>
      )}
    </span>
  );
};
