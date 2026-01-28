import { Alert } from "@clientComponents/globals";
import { BackButton, Button } from "@clientComponents/globals/Buttons";

import { TotpRegister } from "./components/totp-register";
import { I18n } from "@i18n";
import { UserAvatar } from "@serverComponents/UserAvatar";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { loadMostRecentSession } from "@lib/session";
import { addOTPEmail, addOTPSMS, getLoginSettings, registerTOTP } from "@lib/zitadel";
import { RegisterTOTPResponse } from "@zitadel/proto/zitadel/user/v2/user_service_pb";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSerializableObject } from "@lib/utils";
import { AuthPanelTitle } from "@serverComponents/globals/AuthPanelTitle";

export default async function Page(props: {
  searchParams: Promise<Record<string | number | symbol, string | undefined>>;
  params: Promise<Record<string | number | symbol, string | undefined>>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const { loginName, organization, sessionId, requestId, checkAfter } = searchParams;
  const { method } = params;

  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  const loginSettings = await getLoginSettings({
    serviceUrl,
    organization,
  }).then((obj) => getSerializableObject(obj));

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
    } else if (method === "sms") {
      await addOTPSMS({
        serviceUrl,
        userId: session.factors.user.id,
      }).catch((_error) => {
        // TODO: Throw this error?
        new Error("Could not add OTP via SMS");
      });
    } else if (method === "email") {
      await addOTPEmail({
        serviceUrl,
        userId: session.factors.user.id,
      }).catch((_error) => {
        // TODO: Throw this error?
        new Error("Could not add OTP via Email");
      });
    } else {
      throw new Error("Invalid method");
    }
  } else {
    throw new Error("No session found");
  }

  const paramsToContinue = new URLSearchParams({});
  let urlToContinue = "/accounts";

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
    if (requestId) {
      paramsToContinue.append("requestId", requestId);
    }
    urlToContinue = `/otp/${method}?` + paramsToContinue;

    // immediately check the OTP on the next page if sms or email was set up
    if (["email", "sms"].includes(method)) {
      return redirect(urlToContinue);
    }
  } else if (requestId && sessionId) {
    if (requestId) {
      paramsToContinue.append("authRequest", requestId);
    }
    urlToContinue = `/login?` + paramsToContinue;
  } else if (loginName) {
    if (requestId) {
      paramsToContinue.append("requestId", requestId);
    }
    urlToContinue = `/signedin?` + paramsToContinue;
  }

  return (
    <>
      <div id="auth-panel">
        <AuthPanelTitle i18nKey="set.title" namespace="otp" />

        {totpResponse && "uri" in totpResponse && "secret" in totpResponse ? (
          <I18n
            i18nKey="set.totpRegisterDescription"
            namespace="otp"
            tagName="p"
            className="mb-6"
          />
        ) : (
          <p className="ztdl-p">
            {method === "email"
              ? "Code via email was successfully added."
              : method === "sms"
                ? "Code via SMS was successfully added."
                : ""}
          </p>
        )}

        {!session && (
          <div className="py-4">
            <Alert.Danger>
              <I18n i18nKey="unknownContext" namespace="error" />
            </Alert.Danger>
          </div>
        )}

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
            searchParams={searchParams}
          ></UserAvatar>
        )}
      </div>

      <div className="w-full">
        {totpResponse && "uri" in totpResponse && "secret" in totpResponse ? (
          <div>
            <TotpRegister
              uri={totpResponse.uri as string}
              secret={totpResponse.secret as string}
              loginName={loginName}
              sessionId={sessionId}
              requestId={requestId}
              organization={organization}
              checkAfter={checkAfter === "true"}
              loginSettings={loginSettings}
            ></TotpRegister>
          </div>
        ) : (
          <div className="mt-8 flex w-full flex-row items-center">
            <BackButton />
            <span className="flex-grow"></span>

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
