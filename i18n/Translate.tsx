"use client";
import { useTranslation } from "./client";

export function I18n({
  i18nKey,
  namespace,
  data,
  ...props
}: {
  i18nKey: string;
  children?: React.ReactNode;
  namespace?: string;
  data?: any;
} & React.HTMLAttributes<HTMLSpanElement>) {
  const { t } = useTranslation(namespace);
  const helperKey = `${namespace ? `${namespace}.` : ""}${i18nKey}`;

  return (
    <span data-i18n-key={helperKey} {...props}>
      {t(i18nKey, data) as string}
    </span>
  );
}
