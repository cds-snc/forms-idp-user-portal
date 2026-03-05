/*--------------------------------------------*
 * Framework and Third-Party
 *--------------------------------------------*/
import Link from "next/link";

/*--------------------------------------------*
 * Relative
 *--------------------------------------------*/
import { Logo } from "./Logo";
import SiteTitle from "./SiteTitle";
export const SiteLink = ({ href }: { href: string }) => {
  return (
    <Link
      href={href}
      prefetch={false}
      id="logo"
      className="flex items-center no-underline focus:bg-white"
    >
      <span className="inline-block">
        <Logo />
      </span>
      <SiteTitle />
    </Link>
  );
};
