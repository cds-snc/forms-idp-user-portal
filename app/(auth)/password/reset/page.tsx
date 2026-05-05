/*--------------------------------------------*
 * Framework and Third-Party
 *--------------------------------------------*/
import { Metadata } from "next";

/*--------------------------------------------*
 * Internal Aliases
 *--------------------------------------------*/
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
  return (
    <AuthPanel
      titleI18nKey="reset.title"
      descriptionI18nKey="reset.description"
      namespace="password"
    >
      <PasswordResetFlow />
    </AuthPanel>
  );
}
