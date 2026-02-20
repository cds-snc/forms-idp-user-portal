import LanguageToggle from "@components/LanguageToggle";
import { BrandContainer } from "./BrandContainer";
import { Fip } from "./Fip";
import { SkipLink } from "@components/SkipLink";

export const GcdsHeader = ({
  language,
  showLanguageToggle = true,
  skipLink = true,
  children,
}: {
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
          <div className="brand__toggle">
            {children}
            {showLanguageToggle && <LanguageToggle />}
          </div>
        </BrandContainer>
      </header>
    </div>
  );
};
