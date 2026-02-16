import { RegisterForm } from "./components/RegisterForm";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { getLegalAndSupportSettings, getPasswordComplexitySettings } from "@lib/zitadel";
import { Metadata } from "next";
import { serverTranslation } from "@i18n/server";
import { headers } from "next/headers";
import { AuthPanel } from "@serverComponents/globals/AuthPanel";
import { ZITADEL_ORGANIZATION } from "@root/constants/config";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("register");
  return { title: t("title") };
}

export default async function Page() {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  const organization = ZITADEL_ORGANIZATION;

  const legal = await getLegalAndSupportSettings({
    serviceUrl,
    organization,
  });

  const passwordComplexitySettings = await getPasswordComplexitySettings({
    serviceUrl,
    organization,
  });

  return (
    <AuthPanel titleI18nKey="title" descriptionI18nKey="description" namespace="register">
      {legal && passwordComplexitySettings && organization && (
        <RegisterForm organization={organization}></RegisterForm>
      )}
    </AuthPanel>
  );
}
