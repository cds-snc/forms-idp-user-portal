import { Alert } from "@clientComponents/globals";
import { BackButton } from "@clientComponents/globals/Buttons/BackButton";
import { ChooseAuthenticatorToSetup } from "./components/choose-authenticator-to-setup";

import { I18n } from "@i18n";
import { UserAvatar } from "@serverComponents/UserAvatar";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { loadSessionById, loadSessionByLoginname } from "@lib/session";
import { checkUserVerification } from "@lib/verify-helper";
import { getActiveIdentityProviders, getLoginSettings } from "@lib/zitadel";
import { Metadata } from "next";

import { serverTranslation } from "@i18n/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSerializableObject } from "@lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("authenticator");
  return { title: t("title") };
}

export default async function Page(props: {
  searchParams: Promise<Record<string | number | symbol, string | undefined>>;
}) {
  const searchParams = await props.searchParams;

  const { loginName, requestId, organization, sessionId } = searchParams;

  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  const sessionWithData = sessionId
    ? await loadSessionById(serviceUrl, sessionId, organization)
    : await loadSessionByLoginname(serviceUrl, loginName, organization);

  console.log("Loaded session with data:", sessionWithData);

  if (!sessionWithData || !sessionWithData.factors || !sessionWithData.factors.user) {
    return (
      <Alert.Danger>
        <I18n i18nKey="unknownContext" namespace="error" />
      </Alert.Danger>
    );
  }

  const loginSettings = await getLoginSettings({
    serviceUrl,
    organization: sessionWithData.factors.user?.organizationId,
  }).then((obj) => getSerializableObject(obj));

  // check if user was verified recently or if their email is already verified in Zitadel
  const isUserVerified = await checkUserVerification(sessionWithData.factors.user?.id);

  if (!isUserVerified && !sessionWithData.emailVerified) {
    const params = new URLSearchParams({
      loginName: sessionWithData.factors.user.loginName as string,
      send: "true", // set this to true to request a new code immediately
    });

    if (requestId) {
      params.append("requestId", requestId);
    }

    if (organization || sessionWithData.factors.user.organizationId) {
      params.append(
        "organization",
        organization ?? (sessionWithData.factors.user.organizationId as string)
      );
    }

    redirect(`/verify?` + params);
  }

  const identityProviders = await getActiveIdentityProviders({
    serviceUrl,
    orgId: sessionWithData.factors?.user?.organizationId,
    linking_allowed: true,
  }).then((resp) => {
    return resp.identityProviders;
  });

  const params = new URLSearchParams({
    initial: "true", // defines that a code is not required and is therefore not shown in the UI
  });

  if (sessionWithData.factors?.user?.loginName) {
    params.set("loginName", sessionWithData.factors?.user?.loginName);
  }

  if (sessionWithData.factors?.user?.organizationId) {
    params.set("organization", sessionWithData.factors?.user?.organizationId);
  }

  if (requestId) {
    params.set("requestId", requestId);
  }

  return (
    <>
      <div className="flex flex-col space-y-4">
        <h1>
          <I18n i18nKey="title" namespace="authenticator" />
        </h1>

        <p className="ztdl-p">
          <I18n i18nKey="description" namespace="authenticator" />
        </p>

        <UserAvatar
          loginName={sessionWithData.factors?.user?.loginName}
          displayName={sessionWithData.factors?.user?.displayName}
          showDropdown
          searchParams={searchParams}
        ></UserAvatar>
      </div>

      <div className="w-full">
        {loginSettings && (
          <ChooseAuthenticatorToSetup
            authMethods={sessionWithData.authMethods}
            loginSettings={loginSettings}
            params={params}
          ></ChooseAuthenticatorToSetup>
        )}

        <div className="mt-8 flex w-full flex-row items-center">
          <BackButton />
          <span className="flex-grow"></span>
        </div>
      </div>
    </>
  );
}
