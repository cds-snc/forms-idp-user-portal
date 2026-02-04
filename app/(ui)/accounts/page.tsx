import { SessionsList } from "./components/sessions-list";
import { I18n } from "@i18n";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { getDefaultOrg, getSession, getUserByID } from "@lib/zitadel";
import { loadSessionsFromCookies } from "@lib/server/session";

import { AddIcon } from "@serverComponents/icons";
import { Organization } from "@zitadel/proto/zitadel/org/v2/org_pb";
import { Metadata } from "next";

import { serverTranslation } from "@i18n/server";

import { headers } from "next/headers";
import Link from "next/link";
import { AuthPanelTitle } from "@serverComponents/globals/AuthPanelTitle";
import { getMostRecentSessionCookie } from "@lib/cookies";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("accounts");
  return { title: t("title") };
}

export default async function Page(props: {
  searchParams: Promise<Record<string | number | symbol, string | undefined>>;
}) {
  const searchParams = await props.searchParams;

  const requestId = searchParams?.requestId;
  const organization = searchParams?.organization;

  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  let defaultOrganization;
  if (!organization) {
    const org: Organization | null = await getDefaultOrg({
      serviceUrl,
    });
    if (org) {
      defaultOrganization = org.id;
    }
  }

  const sessions = await loadSessionsFromCookies({ serviceUrl });

  // Get current user's email verification status
  const recentCookie = await getMostRecentSessionCookie();
  let emailVerified = false;
  let currentLoginName: string | undefined;
  if (recentCookie) {
    const sessionResponse = await getSession({
      serviceUrl,
      sessionId: recentCookie.id,
      sessionToken: recentCookie.token,
    });
    currentLoginName = sessionResponse?.session?.factors?.user?.loginName;
    const userId = sessionResponse?.session?.factors?.user?.id;

    if (userId) {
      const userResponse = await getUserByID({
        serviceUrl,
        userId,
      });
      const humanUser =
        userResponse?.user?.type?.case === "human" ? userResponse.user.type.value : undefined;
      emailVerified = humanUser?.email?.isVerified ?? false;
    }
  }

  const params = new URLSearchParams();

  if (requestId) {
    params.append("requestId", requestId);
  }

  if (organization) {
    params.append("organization", organization);
  } else if (defaultOrganization) {
    params.append("organization", defaultOrganization);
  }

  const verifyParams = new URLSearchParams(params);
  if (currentLoginName) {
    verifyParams.append("loginName", currentLoginName);
  }

  const mfaParams = new URLSearchParams(params);
  if (currentLoginName) {
    mfaParams.append("loginName", currentLoginName);
  }

  return (
    <>
      <div id="auth-panel">
        <AuthPanelTitle i18nKey="title" namespace="accounts" />
        <I18n i18nKey="description" namespace="accounts" tagName="p" className="mb-6" />

        <div className="w-full">
          <div className="flex w-full flex-col space-y-2">
            <SessionsList sessions={sessions} requestId={requestId} />
            {!emailVerified && (
              <Link href={`/verify?${verifyParams}`}>
                <div className="flex flex-row items-center rounded-md px-4 py-3 transition-all hover:bg-black/10">
                  <div className="mr-2 flex size-8 flex-row items-center justify-center rounded-full">
                    <AddIcon className="size-5" />
                  </div>
                  <I18n i18nKey="verifyEmail" namespace="accounts" className="text-sm" />
                </div>
              </Link>
            )}
            <Link href={`/mfa/set?${mfaParams}`}>
              <div className="flex flex-row items-center rounded-md px-4 py-3 transition-all hover:bg-black/10">
                <div className="mr-2 flex size-8 flex-row items-center justify-center rounded-full">
                  <AddIcon className="size-5" />
                </div>
                <I18n i18nKey="setUpMFA" namespace="accounts" className="text-sm" />
              </div>
            </Link>
            <Link href={`/start?` + params}>
              <div className="flex flex-row items-center rounded-md px-4 py-3 transition-all hover:bg-black/10">
                <div className="mr-2 flex size-8 flex-row items-center justify-center rounded-full">
                  <AddIcon className="size-5" />
                </div>
                <I18n i18nKey="addAnother" namespace="accounts" className="text-sm" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
