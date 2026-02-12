import { headers } from "next/headers";

import { Alert } from "@clientComponents/globals";
import { BackButton, Button } from "@clientComponents/globals/Buttons";

import { TotpRegister } from "@components/mfa/otp/TotpRegister";
import { I18n } from "@i18n";
import { UserAvatar } from "@serverComponents/UserAvatar";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { loadMostRecentSession, loadSessionById } from "@lib/session";
import { registerTOTP } from "@lib/zitadel";
import { RegisterTOTPResponse } from "@zitadel/proto/zitadel/user/v2/user_service_pb";
import { getSessionCredentials } from "@lib/cookies";

import Link from "next/link";
import { getSerializableLoginSettings } from "@lib/zitadel";
import { AuthPanel } from "@serverComponents/globals/AuthPanel";

export default async function Page(props: {
  searchParams: Promise<Record<string | number | symbol, string | undefined>>;
  params: Promise<Record<string | number | symbol, string | undefined>>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const { sessionId, loginName, organization } = await getSessionCredentials();
  const checkAfter = searchParams.checkAfter === "true";

  const { method } = params;

  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  const sessionFactors = await loadSessionById(serviceUrl, sessionId, organization);
  const loginSettings = await getSerializableLoginSettings({
    serviceUrl,
    organizationId: sessionFactors.factors?.user?.organizationId,
  });

  const session = await loadMostRecentSession({
    serviceUrl,
    sessionParams: {
      loginName,
      organization,
    },
  });

  let totpResponse: RegisterTOTPResponse | undefined, error: Error | undefined;
  if (session && session.factors?.user?.id) {
    if (method === "time-based") {
      await registerTOTP({
        serviceUrl,
        userId: session.factors.user.id,
      })
        .then((resp) => {
          if (resp) {
            totpResponse = resp;
          }
        })
        .catch((err) => {
          error = err;
        });
    } else {
      throw new Error("Invalid authentication method");
    }
  } else {
    throw new Error("No session found");
  }

  const paramsToContinue = new URLSearchParams({});
  let urlToContinue = "/signedin";

  if (sessionId) {
    paramsToContinue.append("sessionId", sessionId);
  }
  if (loginName) {
    paramsToContinue.append("loginName", loginName);
  }
  if (organization) {
    paramsToContinue.append("organization", organization);
  }

  if (checkAfter) {
    urlToContinue = `/otp/${method}?` + paramsToContinue;
  } else if (loginName) {
    urlToContinue = `/signedin?` + paramsToContinue;
  }

  return (
    <>
      <AuthPanel titleI18nKey="set.title" descriptionI18nKey="none" namespace="otp">
        {totpResponse && "uri" in totpResponse && "secret" in totpResponse ? (
          <I18n
            i18nKey="set.totpRegisterDescription"
            namespace="otp"
            tagName="p"
            className="mb-6"
          />
        ) : null}

        {error && (
          <div className="py-4">
            <Alert.Warning>{error?.message}</Alert.Warning>
          </div>
        )}

        {session && (
          <UserAvatar
            loginName={loginName ?? session.factors?.user?.loginName}
            displayName={session.factors?.user?.displayName}
            showDropdown
          ></UserAvatar>
        )}
      </AuthPanel>

      <div className="w-full">
        {totpResponse && "uri" in totpResponse && "secret" in totpResponse ? (
          <div>
            <TotpRegister
              uri={totpResponse.uri as string}
              secret={totpResponse.secret as string}
              loginName={loginName}
              sessionId={sessionId}
              organization={organization}
              checkAfter={checkAfter}
              loginSettings={loginSettings}
            ></TotpRegister>
          </div>
        ) : (
          <div className="mt-8 flex w-full flex-row items-center">
            <BackButton />
            <span className="grow"></span>

            <Link href={urlToContinue}>
              <Button>
                <I18n i18nKey="set.submit" namespace="otp" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
