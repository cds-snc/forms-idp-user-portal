import { ChooseSecondFactor } from "../../../components/mfa/ChooseSecondFactor";
import { I18n } from "@i18n";
import { UserAvatar } from "@serverComponents/UserAvatar/UserAvatar";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { loadSessionById, loadSessionByLoginname } from "@lib/session";
import { Metadata } from "next";
import { serverTranslation } from "i18n/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthPanel } from "@serverComponents/globals/AuthPanel";
import { AuthenticationMethodType } from "@zitadel/proto/zitadel/user/v2/user_service_pb";
import Link from "next/link";
import { getSessionCredentials } from "@lib/cookies";

// Strong MFA methods that must be configured before accessing the MFA selection page
const STRONG_MFA_METHODS = [AuthenticationMethodType.TOTP, AuthenticationMethodType.U2F];

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("mfa");
  return { title: t("verify.title") };
}

export default async function Page() {
  const { loginName, organization, sessionId } = await getSessionCredentials();

  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  const sessionFactors = sessionId
    ? await loadSessionById(serviceUrl, sessionId, organization)
    : await loadSessionByLoginname(serviceUrl, loginName, organization);

  if (!sessionFactors) {
    throw new Error("No session factors found");
  }

  // Check if user has at least one strong MFA method (TOTP or U2F)
  const hasStrongMFA = STRONG_MFA_METHODS.some((method) =>
    sessionFactors.authMethods?.includes(method)
  );

  // Redirect to MFA setup if no strong MFA method is configured
  if (!hasStrongMFA) {
    redirect("/mfa/set");
  }

  return (
    <>
      <AuthPanel titleI18nKey="title" descriptionI18nKey="verify.description" namespace="mfa">
        <div className="flex flex-col space-y-4">
          <UserAvatar
            loginName={loginName ?? sessionFactors.factors?.user?.loginName}
            displayName={sessionFactors.factors?.user?.displayName}
            showDropdown
          ></UserAvatar>
        </div>
        <ChooseSecondFactor userMethods={sessionFactors.authMethods ?? []} />
        <div className="mt-6">
          <Link
            href="/mfa/set"
            className="text-gcds-blue-muted underline hover:text-gcds-blue-vivid"
          >
            <I18n i18nKey="set.addAnother" namespace="mfa" />
          </Link>
        </div>
      </AuthPanel>
    </>
  );
}
