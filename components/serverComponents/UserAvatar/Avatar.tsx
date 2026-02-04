"use client";

interface AvatarProps {
  name: string | null | undefined;
  loginName: string;
  imageUrl?: string;
  size?: "small" | "base" | "large";
  shadow?: boolean;
}

export function getInitials(name: string, loginName: string) {
  let credentials = "";
  if (name) {
    const split = name.split(" ");
    if (split) {
      const initials = split[0].charAt(0) + (split[1] ? split[1].charAt(0) : "");
      credentials = initials;
    } else {
      credentials = name.charAt(0);
    }
  } else {
    const username = loginName.split("@")[0];
    let separator = "_";
    if (username.includes("-")) {
      separator = "-";
    }
    if (username.includes(".")) {
      separator = ".";
    }
    const split = username.split(separator);
    const initials = split[0].charAt(0) + (split[1] ? split[1].charAt(0) : "");
    credentials = initials;
  }

  return credentials;
}

export function Avatar({ size = "base", name, loginName, imageUrl, shadow }: AvatarProps) {
  const credentials = getInitials(name ?? loginName, loginName);

  return (
    <div
      className={`pointer-events-none flex h-full w-full flex-shrink-0 cursor-default items-center justify-center bg-gcds-blue-500 text-white transition-colors duration-200 rounded-full ${
        shadow ? "shadow" : ""
      } ${
        size === "large"
          ? "h-20 w-20 font-normal"
          : size === "base"
            ? "h-[38px] w-[38px] font-bold"
            : size === "small"
              ? "!h-[32px] !w-[32px] text-[13px] font-bold"
              : "h-12 w-12"
      }`}
    >
      {imageUrl ? (
        <img
          height={48}
          width={48}
          alt="avatar"
          className={`h-full w-full border border-divider-light dark:border-divider-dark rounded-lg`}
          src={imageUrl}
        />
      ) : (
        <span className={`uppercase ${size === "large" ? "text-xl" : "text-13px"}`}>
          {credentials}
        </span>
      )}
    </div>
  );
}
