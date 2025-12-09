import { languages } from "./settings";
import { cookies } from "next/headers";
import { LANGUAGE_COOKIE_NAME } from "./client";

export const languageParamSanitization = (locale: string | string[] | undefined) => {
  // If provided with an array, return the first the default locale
  if (Array.isArray(locale) || locale === undefined) {
    return languages[0];
  }
  if (languages.includes(locale)) {
    return locale;
  }
  // If unknown locale, return default locale
  return languages[0];
};

export async function getCurrentLanguage() {
  const cookieLang = (await cookies()).get(LANGUAGE_COOKIE_NAME)?.value;
  return cookieLang || languages[0];
}
