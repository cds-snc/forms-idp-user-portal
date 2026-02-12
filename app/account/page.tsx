import { Metadata } from "next";
import { serverTranslation } from "@i18n/server";
import { AccountInformation } from "./components/AccountInformation";
import { headers } from "next/headers";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { getSessionCredentials } from "@lib/cookies";
import { loadSessionById } from "@lib/session";
import { getUserByID } from "@lib/zitadel";
import { Authentication } from "./components/Authentication";

// TODO add translation strings

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("otp");
  return { title: t("account.title") };
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

  return (
    <>
      <div>Account</div>
      <AccountInformation firstName={firstName} lastName={lastName} email={email} />
      <div className="mb-10"></div>
      <Authentication />
    </>
  );
}
