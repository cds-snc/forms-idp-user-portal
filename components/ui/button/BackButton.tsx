"use client";

import { useRouter } from "next/navigation";
import { Button } from "./Button";
import { I18n } from "@i18n";
import { Theme } from "./themes";

export function BackButton({ theme = "secondary" }: { theme?: Theme }) {
  const router = useRouter();
  return (
    <Button onClick={() => router.back()} type="button" theme={theme}>
      <I18n i18nKey="button.back" namespace="common" />
    </Button>
  );
}
