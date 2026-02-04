import { LoginSettings } from "@zitadel/proto/zitadel/settings/v2/login_settings_pb";
import { AuthenticationMethodType } from "@zitadel/proto/zitadel/user/v2/user_service_pb";
import { Alert } from "@clientComponents/globals";
import { PASSWORD } from "@serverComponents/AuthMethods/AuthMethods";
import { I18n } from "@i18n";

type Props = {
  authMethods: AuthenticationMethodType[];
  params: URLSearchParams;
  loginSettings: LoginSettings;
};

export function ChooseAuthenticatorToSetup({ authMethods, params, loginSettings }: Props) {
  // Check if password can be set up
  const canSetupPassword =
    !authMethods.includes(AuthenticationMethodType.PASSWORD) && loginSettings.allowUsernamePassword;

  if (!canSetupPassword && authMethods.length !== 0) {
    return (
      <Alert.Warning>
        <I18n i18nKey="allSetup" namespace="authenticator" />
      </Alert.Warning>
    );
  } else {
    return (
      <div className="grid w-full grid-cols-1 gap-5 pt-4">
        {canSetupPassword && PASSWORD(false, "/password/set?" + params)}
      </div>
    );
  }
}
