/*--------------------------------------------*
 * Framework and Third-Party
 *--------------------------------------------*/
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthenticationMethodType } from "@zitadel/proto/zitadel/user/v2/user_service_pb";

/*--------------------------------------------*
 * Internal Aliases
 *--------------------------------------------*/
import { getSessionCredentials } from "@lib/cookies";
import { logMessage } from "@lib/logger";
import { loadSessionById, loadSessionByLoginname } from "@lib/session";
import { serverTranslation } from "@i18n/server";
import { AuthPanel } from "@components/auth/AuthPanel";
import { StrongFactorSelection } from "@components/mfa/StrongFactorSelection";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("mfa");
  return { title: t("verify.title") };
}

export default async function Page() {
  let sessionId: string | undefined;
  let loginName: string | undefined;

  try {
    ({ sessionId, loginName } = await getSessionCredentials());
  } catch {
    redirect("/password/reset");
  }

  const sessionData = sessionId
    ? await loadSessionById(sessionId)
    : await loadSessionByLoginname(loginName);

  const canUseTotp = sessionData.authMethods?.includes(AuthenticationMethodType.TOTP) ?? false;
  const canUseU2F = sessionData.authMethods?.includes(AuthenticationMethodType.U2F) ?? false;

  if (!sessionData.factors?.user?.id || (!canUseTotp && !canUseU2F)) {
    logMessage.info("Password reset recovery requires at least one strong MFA method");
    redirect("/password/reset");
  }

  return (
    <AuthPanel titleI18nKey="verify.title" descriptionI18nKey="verify.description" namespace="mfa">
      <StrongFactorSelection
        canUseTotp={canUseTotp}
        canUseU2F={canUseU2F}
        totpUrl="/password/reset/verify/time-based"
        u2fUrl="/password/reset/verify/u2f"
      />
    </AuthPanel>
  );
}
