import { I18n } from "@i18n";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/*--------------------------------------------*
 * Types and Constants
 *--------------------------------------------*/
import { type RegisterTOTPResponse } from "@zitadel/proto/zitadel/user/v2/user_service_pb";

/*--------------------------------------------*
 * Methods
 *--------------------------------------------*/
import { registerTOTP } from "@lib/zitadel";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { loadMostRecentSession } from "@lib/session";
import { getSessionCredentials } from "@lib/cookies";
import { buildUrlWithRequestId } from "@lib/utils";
import { checkAuthenticationLevel, AuthLevel } from "@lib/server/route-protection";
import { logMessage } from "@lib/logger";
import { protectedAddOTPEmail } from "@lib/server/zitadel-protected";

/*--------------------------------------------*
 * Components
 *--------------------------------------------*/
import { TotpRegister } from "@components/mfa/otp/TotpRegister";
import * as Alert from "@components/ui/alert/Alert";
import { BackButton } from "@components/ui/button/BackButton";
import { Button } from "@components/ui/button/Button";
import { UserAvatar } from "@components/account/user-avatar";
import { AuthPanel } from "@components/auth/AuthPanel";
import { LOGGED_IN_HOME_PAGE } from "@root/constants/config";

export default async function Page(props: {
  searchParams: Promise<Record<string | number | symbol, string | undefined>>;
  params: Promise<Record<string | number | symbol, string | undefined>>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const { loginName, organization, requestId } = await getSessionCredentials();
  const checkAfter = searchParams.checkAfter === "true";

  const { method } = params;

  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  const authCheck = await checkAuthenticationLevel(
    serviceUrl,
    AuthLevel.PASSWORD_REQUIRED,
    loginName,
    organization
  );

  if (!authCheck.satisfied) {
    logMessage.debug({
      message: "OTP setup page auth check failed",
      method,
      reason: authCheck.reason,
      redirect: authCheck.redirect,
    });
    redirect(authCheck.redirect || "/password");
  }

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
          logMessage.debug({
            message: "Failed to register TOTP during OTP setup",
            error: err,
          });
          error = err;
        });
    } else if (method === "email") {
      const addOtpEmailResponse = await protectedAddOTPEmail(session.factors.user.id);
      if ("error" in addOtpEmailResponse && addOtpEmailResponse.error) {
        logMessage.debug({
          message: "Failed to enable OTP email during OTP setup",
          error: addOtpEmailResponse.error,
        });
      }
    } else {
      logMessage.debug({
        message: "Invalid OTP setup method",
        method,
      });
      redirect("/mfa/set");
    }
  } else {
    logMessage.debug({
      message: "OTP setup page missing session",
      method,
      hasLoginName: !!loginName,
      hasOrganization: !!organization,
    });
    redirect("/mfa/set");
  }

  let urlToContinue = buildUrlWithRequestId(LOGGED_IN_HOME_PAGE, requestId);

  if (checkAfter) {
    urlToContinue = `/otp/${method}?`;
  } else if (loginName) {
    urlToContinue = buildUrlWithRequestId(LOGGED_IN_HOME_PAGE, requestId);
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
            showDropdown={false}
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
              organization={organization}
              requestId={requestId}
              checkAfter={checkAfter}
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
