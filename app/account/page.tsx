import { Metadata } from "next";
import { headers } from "next/headers";
import { serverTranslation } from "@i18n/server";

import { getServiceUrlFromHeaders } from "@lib/service-url";
import { getSessionCredentials } from "@lib/cookies";
import { loadSessionById } from "@lib/session";

import { Authentication } from "./components/Authentication";
import { AccountInformation } from "./components/AccountInformation";
import { getTOTPStatus, getSecurityKeys, getUserByID } from "@lib/zitadel";

// TODO add translation strings

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("account");
  return { title: t("title") };
}

export default async function Page() {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  // Load account information from the session cookie
  const { sessionId, organization } = await getSessionCredentials();
  const session = await loadSessionById(serviceUrl, sessionId, organization);
  const userId = session.factors?.user?.id;
  const userResponse = await getUserByID({ serviceUrl, userId: userId! });
  const user = userResponse.user?.type.case === "human" ? userResponse.user?.type.value : undefined;
  const firstName = user?.profile?.givenName;
  const lastName = user?.profile?.familyName;
  const email = user?.email?.email;

  if (!firstName || !lastName || !email) {
    throw new Error("User information could not be retrieved from session.");
  }

  const [yubikeyInfo, authenticatorStatus] = await Promise.all([
    getSecurityKeys({
      serviceUrl,
      userId: userId!,
    }),
    getTOTPStatus({
      serviceUrl,
      userId: userId!,
    }),
  ]);

  return (
    <>
      <AccountInformation firstName={firstName} lastName={lastName} email={email} />
      <div className="mb-10"></div>
      <Authentication yubikeyInfo={yubikeyInfo} authenticatorStatus={authenticatorStatus} />
    </>
  );
}
