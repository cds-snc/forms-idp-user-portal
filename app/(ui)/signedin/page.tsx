import { LinkButton } from "@serverComponents/globals/Buttons/LinkButton";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { isSessionValid, loadMostRecentSession, loadSessionFactorsById } from "@lib/session";
import { getLoginSettings } from "@lib/zitadel";
import { AuthPanel } from "@serverComponents/globals/AuthPanel";
import { Metadata } from "next";
import { serverTranslation } from "@i18n/server";
import { I18n } from "@i18n";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { SearchParams } from "@lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("signedin");
  return { title: t("title", { user: "" }) };
}

export default async function Page(props: { searchParams: Promise<SearchParams> }) {
  let sessionFactors;
  let loginSettings;

  try {
    const searchParams = await props.searchParams;

    const _headers = await headers();
    const { serviceUrl } = getServiceUrlFromHeaders(_headers);

    const { loginName, requestId, organization, sessionId } = searchParams;

    sessionFactors = sessionId
      ? await loadSessionFactorsById(serviceUrl, sessionId, organization)
      : await loadMostRecentSession({
          serviceUrl,
          sessionParams: { loginName, organization },
        });

    // Verify the session is fully authenticated
    if (!sessionFactors) {
      redirect("/start");
    }

    // @TODO: need something stricter than this - must have password + "strong" mfa
    const valid = await isSessionValid({ serviceUrl, session: sessionFactors });
    if (!valid) {
      redirect("/start");
    }

    if (!requestId) {
      loginSettings = await getLoginSettings({
        serviceUrl,
        organization,
      });
    }
  } catch (error) {
    // Let redirect errors propagate - they're not real errors
    if (isRedirectError(error)) {
      throw error;
    }
    redirect("/start");
  }

  return (
    <AuthPanel
      titleI18nKey="title"
      descriptionI18nKey="description"
      namespace="signedin"
      titleData={{ user: sessionFactors?.factors?.user?.displayName }}
    >
      <div className="w-full">
        {loginSettings?.defaultRedirectUri && (
          <div className="mt-8 flex w-full flex-row items-center">
            <span className="grow"></span>
            <LinkButton.Primary href={loginSettings?.defaultRedirectUri}>
              <I18n i18nKey="continue" namespace="signedin" />
            </LinkButton.Primary>
          </div>
        )}
      </div>
    </AuthPanel>
  );
}
