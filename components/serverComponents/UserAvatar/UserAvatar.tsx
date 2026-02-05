import { Avatar } from "./Avatar";
import { ChevronDown } from "@serverComponents/icons";
import Link from "next/link";

type Props = {
  loginName?: string;
  displayName?: string;
  showDropdown: boolean;
  searchParams?: Record<string | number | symbol, string | undefined>;
};

export function UserAvatar({ loginName, displayName, showDropdown, searchParams }: Props) {
  const params = new URLSearchParams({});

  if (searchParams?.sessionId) {
    params.set("sessionId", searchParams.sessionId);
  }

  if (searchParams?.organization) {
    params.set("organization", searchParams.organization);
  }

  if (searchParams?.requestId) {
    params.set("requestId", searchParams.requestId);
  }

  if (searchParams?.loginName) {
    params.set("loginName", searchParams.loginName);
  }

  return (
    <div className="flex h-full flex-row items-center rounded-3xl border-2 border-gcds-grayscale-300 p-2">
      {/* <div> */}
      <Avatar size="small" name={displayName ?? loginName ?? ""} loginName={loginName ?? ""} />
      {/* </div> */}
      <span className="ml-4 overflow-hidden text-ellipsis pr-4">{loginName}</span>
      <span className="grow"></span>
      {showDropdown && (
        <Link
          href={"/accounts?" + params}
          className={`ml-4 mr-1 flex items-center justify-center p-1 transition-all hover:bg-black/10 dark:hover:bg-white/10 `}
        >
          <ChevronDown className="size-4" />
        </Link>
      )}
    </div>
  );
}
