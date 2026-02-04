import { I18n } from "@i18n";
import { UserAvatar } from "@serverComponents/UserAvatar";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { loadMostRecentSession } from "@lib/session";
import { getUserByID } from "@lib/zitadel";
import { HumanUser, User } from "@zitadel/proto/zitadel/user/v2/user_pb";
import { headers } from "next/headers";

import { SearchParams } from "@lib/utils";

export default async function Page(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams;

  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  const { loginName, organization, userId } = searchParams;

  const sessionFactors = await loadMostRecentSession({
    serviceUrl,
    sessionParams: { loginName, organization },
  }).catch((error) => {
    console.warn("Error loading session:", error);
  });

  const id = userId ?? sessionFactors?.factors?.user?.id;

  if (!id) {
    throw Error("Failed to get user id");
  }

  const userResponse = await getUserByID({
    serviceUrl,
    userId: id,
  });

  let user: User | undefined;
  let human: HumanUser | undefined;

  if (userResponse) {
    user = userResponse.user;
    if (user?.type.case === "human") {
      human = user.type.value as HumanUser;
    }
  }

  return (
    <>
      <div className="flex flex-col space-y-4">
        <h1>
          <I18n i18nKey="successTitle" namespace="verify" />
        </h1>
        <p className="ztdl-p mb-6 block">
          <I18n i18nKey="successDescription" namespace="verify" />
        </p>

        {sessionFactors ? (
          <UserAvatar
            loginName={loginName ?? sessionFactors.factors?.user?.loginName}
            displayName={sessionFactors.factors?.user?.displayName}
            showDropdown
            searchParams={searchParams}
          ></UserAvatar>
        ) : (
          user && (
            <UserAvatar
              loginName={user.preferredLoginName}
              displayName={human?.profile?.displayName}
              showDropdown={false}
            />
          )
        )}
      </div>
      <div className="w-full"></div>
    </>
  );
}
