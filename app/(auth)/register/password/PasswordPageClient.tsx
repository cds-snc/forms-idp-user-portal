"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordComplexitySettings } from "@zitadel/proto/zitadel/settings/v2/password_settings_pb";

import { useRegistration } from "../context/RegistrationContext";
import { SetRegisterPasswordForm } from "./components/SetRegisterPasswordForm";

type Props = {
  passwordComplexitySettings: PasswordComplexitySettings;
};

export function PasswordPageClient({ passwordComplexitySettings }: Props) {
  const router = useRouter();
  const { registrationData, isHydrated } = useRegistration();
  // Track if form was submitted successfully - prevents redirect when data is cleared
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    // Once hydrated, if no registration data exists and form wasn't submitted, redirect to step 1
    if (isHydrated && !registrationData && !hasSubmitted) {
      router.replace("/register");
    }
  }, [isHydrated, registrationData, hasSubmitted, router]);

  const onSubmitSuccess = () => {
    setHasSubmitted(true);
  };

  // Show nothing while hydrating from sessionStorage
  if (!isHydrated) {
    return null;
  }

  // Show nothing while redirecting (no registration data and didn't submit)
  if (!registrationData && !hasSubmitted) {
    return null;
  }

  return (
    <SetRegisterPasswordForm
      passwordComplexitySettings={passwordComplexitySettings}
      email={registrationData?.email ?? ""}
      firstname={registrationData?.firstname ?? ""}
      lastname={registrationData?.lastname ?? ""}
      organization={registrationData?.organization || ""}
      onSubmitSuccess={onSubmitSuccess}
    />
  );
}
