import { getServiceUrlFromHeaders } from "@lib/service-url";
import { getPasswordComplexitySettings } from "@lib/zitadel";
import { Metadata } from "next";
import { serverTranslation } from "@i18n/server";
import { headers } from "next/headers";
import { getSessionCredentials } from "@lib/cookies";

import { AuthPanel } from "@serverComponents/globals/AuthPanel";
import { PasswordResetFlow } from "./components/PasswordResetFlow";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("password");
  return { title: t("reset.title") };
}

export default async function Page() {
  const { organization } = await getSessionCredentials();
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  const passwordComplexitySettings = await getPasswordComplexitySettings({
    serviceUrl,
    organization,
  });

  return (
    <AuthPanel
      titleI18nKey="reset.title"
      descriptionI18nKey="reset.description"
      namespace="password"
    >
      <PasswordResetFlow
        passwordComplexitySettings={passwordComplexitySettings}
        organization={organization}
      />
    </AuthPanel>
  );
}
