import { headers } from "next/headers";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { serverTranslation } from "@i18n/server";
import { loadSessionsFromCookies } from "@lib/server/session";
import { LogoutButton } from "@components/LogoutButton";
import { isSessionValid } from "@lib/session";

export const Logout = async ({ className }: { className?: string }) => {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const { t } = await serverTranslation("header");
  const allSessions = await loadSessionsFromCookies({ serviceUrl });

  // Filter to only fully authenticated sessions (isSessionValid is async)
  const validSessions = await Promise.all(
    allSessions.map(async (session) => {
      if (!session?.factors?.user?.loginName) return null;
      const valid = await isSessionValid({ serviceUrl, session });
      return valid ? session : null;
    })
  ).then((results) => results.filter(Boolean));

  if (validSessions.length < 1) {
    return null;
  }

  return <LogoutButton className={className} label={t("logout")} />;
};
