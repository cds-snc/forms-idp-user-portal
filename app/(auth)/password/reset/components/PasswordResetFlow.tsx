"use client";

import { useState } from "react";
import { PasswordComplexitySettings } from "@zitadel/proto/zitadel/settings/v2/password_settings_pb";
import { UserNameForm } from "./UserNameForm";
import { PasswordReset } from "./PasswordReset";

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
