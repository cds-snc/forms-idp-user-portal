import { Alert } from "@clientComponents/globals/Alert/Alert";
import { BackButton } from "@clientComponents/globals/Buttons/BackButton";
import { ChooseSecondFactor } from "./components/choose-second-factor";
import { I18n } from "@i18n";
import { UserAvatar } from "@serverComponents/UserAvatar/UserAvatar";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { loadSessionById, loadSessionByLoginname } from "@lib/session";
import { Metadata } from "next";
import { serverTranslation } from "i18n/server";
import { headers } from "next/headers";
import { AuthPanelTitle } from "@serverComponents/globals/AuthPanelTitle";
import { SearchParams } from "@lib/utils";
import Link from "next/link";

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

  return (
    <>
      <div className="flex flex-col space-y-4">
        <AuthPanelTitle i18nKey="set.title" namespace="mfa" />

        <I18n i18nKey="verify.description" namespace="mfa" tagName="p" className="mb-6" />

        {sessionFactors && (
          <UserAvatar
            loginName={loginName ?? sessionFactors.factors?.user?.loginName}
            displayName={sessionFactors.factors?.user?.displayName}
            showDropdown
            searchParams={searchParams}
          ></UserAvatar>
        )}
      </div>

      <div className="w-full">
        {!(loginName || sessionId) && (
          <Alert.Danger>
            <I18n i18nKey="unknownContext" namespace="error" />
          </Alert.Danger>
        )}
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

        {sessionFactors && (
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

        <div className="mt-8 flex w-full flex-row items-center">
          <BackButton />
          <span className="flex-grow"></span>
        </div>
      </div>
    </>
  );
}
