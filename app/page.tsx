import { Metadata } from "next";
import { I18n } from "@i18n";
import { serverTranslation } from "@i18n/server";
import { LinkButton } from "@serverComponents/globals/Buttons/LinkButton";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("start");
  return { title: t("title") };
}

export default async function Page() {
  return (
    <div id="auth-panel">
      <div className="flex flex-col items-center gap-6">
        <I18n i18nKey="description" namespace="home" />
        <div>
          <LinkButton.Primary href="/start">
            <I18n i18nKey="next" namespace="home" />
          </LinkButton.Primary>
        </div>
      </div>
    </div>
  );
}
