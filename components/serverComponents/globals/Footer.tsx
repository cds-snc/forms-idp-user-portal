import { I18n } from "@i18n";
import { cn } from "@lib/utils";
import { Version } from "@serverComponents/globals/Version";

const BulletPoint = () => {
  return <span className="px-3">&#x2022;</span>;
};

const DefaultLinks = async () => {
  return (
    <span className="mr-10 inline-block">
      <a className="whitespace-nowrap" href={"/about"} target="_blank">
        <I18n i18nKey="about.desc" namespace="footer" />
      </a>
      <BulletPoint />
      <a className="whitespace-nowrap" href={"/terms-of-use"}>
        <I18n i18nKey="terms-of-use.desc" namespace="footer" />
      </a>
      <BulletPoint />
      <a className="whitespace-nowrap" href="/sla">
        <I18n i18nKey="sla.desc" namespace="footer" />
      </a>
    </span>
  );
};

export const Footer = async () => {
  return (
    <footer
      className={cn(
        "mt-16 flex-none border-0 bg-gray-100 px-[1rem] tablet:px-[4rem] py-0 lg:mt-10 laptop:px-32"
      )}
      data-server="true"
      data-testid="footer"
    >
      <div className="flex flex-row items-center justify-between pb-5 pt-10 lg:flex-col lg:items-start lg:gap-4">
        <div>
          <>
            <nav className="inline-block">
              <DefaultLinks />
            </nav>
          </>
          <Version />
        </div>

        <div className="min-w-[168px]">
          <picture>
            <img className="h-10 lg:h-8" alt="fip.text" src="/img/wmms-blk.svg" />
          </picture>
        </div>
      </div>
    </footer>
  );
};
