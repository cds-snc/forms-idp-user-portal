/*--------------------------------------------*
 * Framework and Third-Party
 *--------------------------------------------*/
import { Metadata } from "next";
import { headers } from "next/headers";

/*--------------------------------------------*
 * Internal Aliases
 *--------------------------------------------*/
import { ZITADEL_ORGANIZATION } from "@root/constants/config";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { getPasswordComplexitySettings } from "@lib/zitadel";
import { serverTranslation } from "@i18n/server";
import { AuthPanel } from "@components/auth/AuthPanel";

/*--------------------------------------------*
 * Local Relative
 *--------------------------------------------*/
import { PasswordResetFlow } from "./components/PasswordResetFlow";
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("password");
  return { title: t("reset.title") };
}

export default async function Page() {
  const organization = ZITADEL_ORGANIZATION;
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
