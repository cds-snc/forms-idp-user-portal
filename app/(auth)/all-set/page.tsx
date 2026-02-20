import { headers } from "next/headers";
import Image from "next/image";

import { AuthPanel } from "@serverComponents/globals/AuthPanel";
import { LinkButton } from "@serverComponents/globals/Buttons/LinkButton";
import { CircleCheckIcon } from "@components/icons/CircleCheckIcon";
import { UserAvatar } from "@serverComponents/UserAvatar/UserAvatar";

import { I18n } from "@i18n";

import { completeFlowOrGetUrl } from "@lib/client";
import { getSessionCredentials } from "@lib/cookies";
import { getImageUrl } from "@lib/imageUrl";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { loadSessionById } from "@lib/session";
import { SearchParams, buildUrlWithRequestId } from "@lib/utils";
import { getSerializableLoginSettings } from "@lib/zitadel";

export default async function Page(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams;
  const { requestId, checkAfter, method } = searchParams;

  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  const { sessionId, loginName, organization } = await getSessionCredentials();

  let redirectUrl: string | undefined;

  // If checkAfter is true, redirect to the appropriate verification page
  if (checkAfter === "true") {
    if (method === "time-based") {
      redirectUrl = buildUrlWithRequestId(`/otp/time-based`, requestId);
    } else if (method === "u2f") {
      redirectUrl = buildUrlWithRequestId(`/u2f`, requestId);
    }
  }

  // If no checkAfter redirect, try to get the normal flow redirect URL
  if (!redirectUrl) {
    // Try to get the redirect URL
    if (sessionId && requestId) {
      const sessionFactors = await loadSessionById(serviceUrl, sessionId, organization);
      const loginSettings = await getSerializableLoginSettings({
        serviceUrl,
        organizationId: sessionFactors.factors?.user?.organizationId,
      });

      const callbackResponse = await completeFlowOrGetUrl(
        {
          sessionId,
          requestId,
          organization,
        },
        loginSettings?.defaultRedirectUri
      );

      if ("redirect" in callbackResponse) {
        redirectUrl = callbackResponse.redirect;
      }
    } else if (loginName) {
      const sessionFactors = await loadSessionById(serviceUrl, sessionId, organization);
      const loginSettings = await getSerializableLoginSettings({
        serviceUrl,
        organizationId: sessionFactors.factors?.user?.organizationId,
      });

      const callbackResponse = await completeFlowOrGetUrl(
        {
          loginName,
          organization,
        },
        loginSettings?.defaultRedirectUri
      );

      if ("redirect" in callbackResponse) {
        redirectUrl = callbackResponse.redirect;
      }
    }

    // If we still don't have a redirect URL, use the default
    if (!redirectUrl) {
      redirectUrl = buildUrlWithRequestId("/account", requestId);
    }
  }

  return (
    <div data-wide-panel="true">
      <AuthPanel titleI18nKey="none" descriptionI18nKey="none" namespace="allSet" wide={true}>
        <div className="grid grid-cols-1 gap-8 tablet:grid-cols-2">
          {/* Left column: Goose image */}
          <div className="flex items-center justify-center">
            <Image
              src={getImageUrl("/img/goose_all_set.png")}
              alt="All set"
              width={352}
              height={261}
              className="h-auto w-full max-w-[250px]"
            />
          </div>

          {/* Right column: Title, user info, and button */}
          <div className="flex flex-col justify-center">
            {/* Title with checkmark icon */}
            <div className="mb-8 flex items-center gap-3">
              <h1 className="!mb-0 text-4xl font-bold">
                <I18n i18nKey="title" namespace="allSet" />
              </h1>
              <CircleCheckIcon className="size-10 text-gcds-green-700" />
            </div>

            {/* Description */}
            <p className="mb-8">
              <I18n i18nKey="description" namespace="allSet" />
            </p>

            {/* User email display */}
            {loginName && (
              <div className="mb-8">
                <UserAvatar loginName={loginName} showDropdown={false} />
              </div>
            )}

            {/* Continue button */}
            <div>
              <LinkButton.Primary href={redirectUrl}>
                <I18n i18nKey="continueButton" namespace="allSet" />
              </LinkButton.Primary>
            </div>
          </div>
        </div>
      </AuthPanel>
    </div>
  );
}
