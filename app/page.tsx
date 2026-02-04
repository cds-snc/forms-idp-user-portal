import { Metadata } from "next";
import { I18n } from "@i18n";
import { serverTranslation } from "@i18n/server";
import { LinkButton } from "@serverComponents/globals/Buttons/LinkButton";
import { AuthPanel } from "@serverComponents/globals/AuthPanel";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("start");
  return { title: t("title") };
}

export default async function Page() {
  return (
    <AuthPanel titleI18nKey="title" descriptionI18nKey="description" namespace="home">
      <div className="flex flex-col items-center gap-6 pt-4">
        <LinkButton.Primary href="/start">
          <I18n i18nKey="next" namespace="home" />
        </LinkButton.Primary>
      </div>
    </AuthPanel>
  );
}
