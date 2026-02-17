import { Metadata } from "next";
import { headers } from "next/headers";

/*--------------------------------------------*
 * Methods
 *--------------------------------------------*/
import { serverTranslation } from "@i18n/server";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { loadSessionById } from "@lib/session";
import { getSessionCredentials } from "@lib/cookies";

/*--------------------------------------------*
 * Components
 *--------------------------------------------*/
import { RegisterU2f } from "@components/mfa/u2f/RegisterU2f";
import { UserAvatar } from "@serverComponents/UserAvatar";
import { AuthPanel } from "@serverComponents/globals/AuthPanel";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("u2f");
  return { title: t("set.title") };
}

export default async function Page(props: {
  searchParams: Promise<Record<string | number | symbol, string | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const { checkAfter } = searchParams;

  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  const { sessionId, loginName, organization, requestId } = await getSessionCredentials();
  const sessionFactors = await loadSessionById(serviceUrl, sessionId, organization);

  if (!sessionFactors) {
    throw new Error("No session factors found");
  }

  if (!loginName || !sessionFactors.id) {
    throw new Error("No loginName or sessionId provided");
  }

  return (
    <AuthPanel
      titleI18nKey="set.title"
      descriptionI18nKey="none"
      namespace="u2f"
      imageSrc="/img/key-icon.png"
    >
      <div className="mb-6">
        <UserAvatar
          loginName={loginName ?? sessionFactors.factors?.user?.loginName}
          displayName={sessionFactors.factors?.user?.displayName}
          showDropdown={false}
        ></UserAvatar>
      </div>

      <RegisterU2f
        sessionId={sessionFactors.id}
        requestId={requestId}
        checkAfter={checkAfter === "true"}
      />
    </AuthPanel>
  );
}
