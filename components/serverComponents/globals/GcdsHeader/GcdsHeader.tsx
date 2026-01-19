import { LanguageToggle } from "./LanguageToggle";
import { BrandContainer } from "./BrandContainer";
import { Fip } from "./Fip";
import { SkipLink } from "@root/components/clientComponents/globals";

export const GcdsHeader = ({
  pathname,
  language,
  showLanguageToggle = true,
  skipLink = true,
  children,
}: {
  pathname: string;
  language: string;
  showLanguageToggle?: boolean;
  skipLink?: boolean;
  children?: React.ReactNode;
}) => {
  return (
    <div className="gcds-header__container">
      <header className="gcds-header">
        {skipLink && <SkipLink />}
        <BrandContainer>
          <Fip language={language} />
          {showLanguageToggle && <LanguageToggle pathname={pathname} language={language} />}
          {children}
        </BrandContainer>
      </header>
    </div>
  );
};
