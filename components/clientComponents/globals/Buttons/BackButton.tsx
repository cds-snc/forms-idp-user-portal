"use client";

import { useRouter } from "next/navigation";
import { Button } from "./Button";
import { I18n } from "@i18n";

export function BackButton() {
  const router = useRouter();
  return (
    <Button onClick={() => router.back()} type="button">
      <I18n i18nKey="button.back" namespace="common" />
    </Button>
  );
}
