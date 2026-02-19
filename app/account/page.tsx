import { Metadata } from "next";
import { headers } from "next/headers";
import { serverTranslation } from "@i18n/server";

import { getTOTPStatus, getUserByID, getU2FList } from "@lib/zitadel";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { getSessionCredentials } from "@lib/cookies";
import { isSessionValid, loadMostRecentSession, loadSessionById } from "@lib/session";

import { MFAAuthentication } from "./components/MFAAuthentication";
import { PersonalDetails } from "./components/PersonalDetails";
import { PasswordAuthentication } from "./components/PasswordAuthentication";
import { redirect } from "next/navigation";
import { VerifiedAccount } from "./components/VerifiedAccount";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("account");
  return { title: t("title") };
}

export default async function Page() {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  // Load account information from the session cookie
  const { loginName, sessionId, organization } = await getSessionCredentials();
  const session = await loadSessionById(serviceUrl, sessionId, organization);
  const userId = session.factors?.user?.id;
  const userResponse = await getUserByID({ serviceUrl, userId: userId! });
  const user = userResponse.user?.type.case === "human" ? userResponse.user?.type.value : undefined;
  const firstName = user?.profile?.givenName;
  const lastName = user?.profile?.familyName;
  const email = user?.email?.email;

  if (!firstName || !lastName || !email || !userId || !session.factors?.password) {
    redirect("/login");
  }

  try {
    const authSession = await loadMostRecentSession({
      serviceUrl,
      sessionParams: { loginName, organization },
    });
    if (!authSession) {
      redirect("/login");
    }
    const result = await isSessionValid({ serviceUrl, session: authSession });
    if (!result) {
      redirect("/login");
    }
  } catch (error) {
    redirect("/login");
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
      <PersonalDetails userId={userId} firstName={firstName} lastName={lastName} />
      <div className="mb-8"></div>
      <VerifiedAccount email={email} />
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
