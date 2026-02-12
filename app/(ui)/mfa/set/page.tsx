import { headers } from "next/headers";
import { Metadata } from "next";

/*--------------------------------------------*
 * Methods
 *--------------------------------------------*/
import { getSerializableLoginSettings } from "@lib/zitadel";
import { serverTranslation } from "@i18n/server";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { loadSessionById, checkSessionFactorValidity } from "@lib/session";
import { getSessionCredentials } from "@lib/cookies";

/*--------------------------------------------*
 * Components
 *--------------------------------------------*/
import { ChooseSecondFactorToSetup } from "@components/mfa/ChooseSecondFactorToSetup";
import { AuthPanel } from "@serverComponents/globals/AuthPanel";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("mfa");
  return { title: t("set.title") };
}

export default async function Page() {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const { sessionId, organization } = await getSessionCredentials();
  const sessionFactors = await loadSessionById(serviceUrl, sessionId, organization);
  const loginSettings = await getSerializableLoginSettings({
    serviceUrl,
    organizationId: sessionFactors.factors?.user?.organizationId,
  });

  const { valid } = checkSessionFactorValidity(sessionFactors);

  if (!valid || !sessionFactors.factors?.user?.id) {
    throw new Error("Session is not valid anymore");
  }

  return (
    <>
      <AuthPanel titleI18nKey="set.title" descriptionI18nKey="set.description" namespace="mfa">
        <div className="w-full">
          <div className="flex flex-col space-y-4">
            {valid && loginSettings && sessionFactors && sessionFactors.factors?.user?.id && (
              <ChooseSecondFactorToSetup checkAfter={true} />
            )}
          </div>
        </div>
      </AuthPanel>
    </>
  );
}
