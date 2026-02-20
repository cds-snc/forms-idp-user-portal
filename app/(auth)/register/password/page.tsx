import { Metadata } from "next";
import { headers } from "next/headers";
import { serverTranslation } from "@i18n/server";
import { getServiceUrlFromHeaders } from "@lib/service-url";

import { AuthPanel } from "@components/auth/AuthPanel";
import { PasswordPageClient } from "./PasswordPageClient";
import { getLegalAndSupportSettings, getPasswordComplexitySettings } from "@lib/zitadel";
import { ZITADEL_ORGANIZATION } from "@root/constants/config";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("password");
  return { title: t("create.title") };
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
    <AuthPanel
      titleI18nKey="password.title"
      descriptionI18nKey="password.description"
      namespace="register"
    >
      {legal && passwordComplexitySettings && (
        <PasswordPageClient passwordComplexitySettings={passwordComplexitySettings} />
      )}
    </AuthPanel>
  );
}
