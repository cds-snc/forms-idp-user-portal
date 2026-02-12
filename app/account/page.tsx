import { Metadata } from "next";
import { serverTranslation } from "@i18n/server";
import { AccountInformation } from "./components/AccountInformation";
import { headers } from "next/headers";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { getSessionCredentials } from "@lib/cookies";
import { loadSessionById } from "@lib/session";
import { getUserByID } from "@lib/zitadel";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("otp");
  return { title: t("verify.title") };
}

export default async function Page() {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const { sessionId, organization } = await getSessionCredentials();

  const sessionData = await loadSessionById(serviceUrl, sessionId, organization);

  const userId = sessionData.factors?.user?.id;
  const userResponse = await getUserByID({ serviceUrl, userId: userId! });
  const humanUser =
    userResponse.user?.type.case === "human" ? userResponse.user?.type.value : undefined;

  // const displayName = sessionData.factors?.user?.displayName;
  // const loginName = sessionData.factors?.user?.loginName;
  const email = humanUser?.email?.email;
  const firstName = humanUser?.profile?.givenName;
  const lastName = humanUser?.profile?.familyName;

  if (!firstName || !lastName || !email) {
    throw new Error("User information could not be retrieved");
  }

  return (
    <>
      <div>Account</div>
      <AccountInformation firstName={firstName} lastName={lastName} email={email} />
    </>
  );
}
