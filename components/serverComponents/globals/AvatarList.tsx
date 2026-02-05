import { Avatar } from "@serverComponents/UserAvatar/Avatar";
import Link from "next/link";

export type AvatarListItem = {
  loginName: string;
  requestId: string;
  organization: string;
  suffix: string;
  link: string;
  showDropdown?: boolean;
};

export const AvatarList = ({
  className,
  avatars,
}: {
  className?: string;
  avatars: AvatarListItem[];
}) => {
  if (!Array.isArray(avatars) || (Array.isArray(avatars) && avatars.length === 0)) {
    return <>No session found (Todo).</>;
  }

  return (
    <div className={className}>
      <ul className="list-none divide-y rounded-3xl border-2 pl-0">
        {avatars.map((avatar) => (
          <li key={avatar.requestId}>
            <Link
              href={avatar.link}
              className="flex size-full flex-row items-center gap-3 p-6 no-underline"
            >
              <Avatar size="small" name="Test User" loginName="Test" />
              {avatar.loginName}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
