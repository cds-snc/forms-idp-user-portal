import { Metadata } from "next";
import { headers } from "next/headers";
import { serverTranslation } from "@i18n/server";

import { getTOTPStatus, getUserByID, getU2FList } from "@lib/zitadel";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { getSessionCredentials } from "@lib/cookies";
import { loadSessionById } from "@lib/session";

import { MFAAuthentication } from "./components/MFAAuthentication";
import { AccountInformation } from "./components/AccountInformation";
import { PasswordAuthentication } from "./components/PasswordAuthentication";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("account");
  return { title: t("title") };
}

export default async function Page() {
  const { t } = await serverTranslation("account");
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

  if (!firstName || !lastName || !email || !userId || !session.factors?.password) {
    throw new Error(t("errors.noSession"));
  }

  const [u2fList, authenticatorStatus] = await Promise.all([
    getU2FList({
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
      <AccountInformation userId={userId} firstName={firstName} lastName={lastName} email={email} />
      <div className="mb-8"></div>
      <PasswordAuthentication />
      <div className="mb-8"></div>
      <MFAAuthentication
        u2fList={u2fList}
        authenticatorStatus={authenticatorStatus}
        userId={userId}
      />
    </>
  );
}
