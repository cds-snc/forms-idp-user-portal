import { headers } from "next/headers";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import Link from "next/link";
import { serverTranslation } from "@i18n/server";
import { loadSessionsFromCookies } from "@lib/server/session";

export const Logout = async ({ className }: { className?: string }) => {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const { t } = await serverTranslation("header");
  const sessions = await loadSessionsFromCookies({ serviceUrl }).then((list) =>
    list.filter((session) => session?.factors?.user?.loginName)
  );
  if (sessions.length < 1) {
    return null;
  }

  return (
    <Link href="/logout" className={className} aria-label={t("logout")} prefetch={false}>
      {t("logout")}
    </Link>
  );
};
