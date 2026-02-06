import { Alert } from "@clientComponents/globals/Alert/Alert";
import { ChooseSecondFactor } from "./components/choose-second-factor";
import { I18n } from "@i18n";
import { UserAvatar } from "@serverComponents/UserAvatar/UserAvatar";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { loadSessionById, loadSessionByLoginname } from "@lib/session";
import { Metadata } from "next";
import { serverTranslation } from "i18n/server";
import { headers } from "next/headers";
import { AuthPanel } from "@serverComponents/globals/AuthPanel";
import { SearchParams } from "@lib/utils";
import { AuthenticationMethodType } from "@zitadel/proto/zitadel/user/v2/user_service_pb";
import Link from "next/link";

const POSSIBLE_METHODS = [
  AuthenticationMethodType.TOTP,
  AuthenticationMethodType.U2F,
  AuthenticationMethodType.OTP_EMAIL,
];

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("mfa");
  return { title: t("verify.title") };
}

export default async function Page(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams;

  const { loginName, requestId, organization, sessionId } = searchParams;

  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  const sessionFactors = sessionId
    ? await loadSessionById(serviceUrl, sessionId, organization)
    : await loadSessionByLoginname(serviceUrl, loginName, organization);

  if (!sessionFactors) {
    throw new Error("No session factors found");
  }

  return (
    <AuthPanel titleI18nKey="title" descriptionI18nKey="verify.description" namespace="mfa">
      <div className="flex flex-col space-y-4">
        {sessionFactors && (
          <UserAvatar
            loginName={loginName ?? sessionFactors.factors?.user?.loginName}
            displayName={sessionFactors.factors?.user?.displayName}
            showDropdown
            searchParams={searchParams}
          ></UserAvatar>
        )}
      </div>

      {sessionFactors ? (
        <ChooseSecondFactor
          loginName={loginName}
          sessionId={sessionId}
          requestId={requestId}
          organization={organization}
          userMethods={sessionFactors.authMethods ?? []}
        ></ChooseSecondFactor>
      ) : (
        <Alert.Warning>
          <I18n i18nKey="verify.noResults" namespace="mfa" />
        </Alert.Warning>
      )}

      {sessionFactors &&
        !POSSIBLE_METHODS.every((method) => sessionFactors.authMethods?.includes(method)) && (
          <div className="mt-6">
            <Link
              href={`/mfa/set?${new URLSearchParams({
                ...(loginName && { loginName }),
                ...(sessionId && { sessionId }),
                ...(requestId && { requestId }),
                ...(organization && { organization }),
              }).toString()}`}
              className="text-gcds-blue-muted underline hover:text-gcds-blue-vivid"
            >
              <I18n i18nKey="set.addAnother" namespace="mfa" />
            </Link>
          </div>
        )}
    </AuthPanel>
  );
}
