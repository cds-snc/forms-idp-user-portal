"use client";

/*--------------------------------------------*
 * Framework and Third-Party
 *--------------------------------------------*/
import { PasswordComplexitySettings } from "@zitadel/proto/zitadel/settings/v2/password_settings_pb";

/*--------------------------------------------*
 * Local Relative
 *--------------------------------------------*/
import { UserNameForm } from "./UserNameForm";
type Props = {
  passwordComplexitySettings?: PasswordComplexitySettings;

  requestId?: string;
};

export function PasswordResetFlow({ requestId }: Props) {
  return <UserNameForm requestId={requestId} />;
}
