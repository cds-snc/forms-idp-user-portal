"use client";

/*--------------------------------------------*
 * Framework and Third-Party
 *--------------------------------------------*/
import { useState } from "react";
import { PasswordComplexitySettings } from "@zitadel/proto/zitadel/settings/v2/password_settings_pb";

/*--------------------------------------------*
 * Local Relative
 *--------------------------------------------*/
import { PasswordReset } from "./PasswordReset";
import { UserNameForm } from "./UserNameForm";
type Props = {
  passwordComplexitySettings?: PasswordComplexitySettings;
  organization?: string;
  requestId?: string;
};

export function PasswordResetFlow({ passwordComplexitySettings, organization, requestId }: Props) {
  const [resetData, setResetData] = useState<{ userId: string; loginName: string } | null>(null);

  if (resetData) {
    return (
      <PasswordReset
        userId={resetData.userId}
        passwordComplexitySettings={passwordComplexitySettings}
        organization={organization}
        loginName={resetData.loginName}
      />
    );
  }

  return (
    <UserNameForm organization={organization} requestId={requestId} onSuccess={setResetData} />
  );
}
