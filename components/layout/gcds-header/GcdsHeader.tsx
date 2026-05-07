/*--------------------------------------------*
 * Internal Aliases
 *--------------------------------------------*/
import { SkipLink } from "@components/ui/skip-link/SkipLink";

/*--------------------------------------------*
 * Local Relative
 *--------------------------------------------*/
import { BrandContainer } from "./BrandContainer";
import { Fip } from "./Fip";

export const GcdsHeader = ({
  skipLink = true,
  children,
}: {
  skipLink?: boolean;
  children?: React.ReactNode;
}) => {
  return (
    <div className="gcds-header__container">
      <header className="gcds-header">
        {skipLink && <SkipLink />}
        <BrandContainer>
          <Fip />
          <div className="brand__toggle">{children}</div>
        </BrandContainer>
      </header>
    </div>
  );
};

export const GcdsHeaderSkeleton = () => (
  <div className="gcds-header__container">
    <header className="gcds-header"></header>
  </div>
);
