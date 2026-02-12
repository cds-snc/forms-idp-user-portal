import { dir } from "i18next";
import "@root/styles/app.scss";
import { Viewport } from "next";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Noto_Sans, Lato } from "next/font/google";
import { Footer } from "@serverComponents/globals/Footer";
import Link from "next/link";
import { ToastContainer } from "@clientComponents/globals";
import { SiteLogo } from "@serverComponents/icons";
import { serverTranslation } from "@i18n/server";
import { I18n } from "@i18n";
import { Logout } from "@serverComponents/globals/Logout";
import { GcdsHeader } from "@serverComponents/globals/GcdsHeader/GcdsHeader";
import { FooterLinks } from "@clientComponents/globals/FooterLinks";

export const dynamic = "force-dynamic";

const notoSans = Noto_Sans({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-noto-sans",
  subsets: ["latin"],
});

const lato = Lato({
  weight: ["400", "700"],
  variable: "--font-lato",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function Layout({ children }: { children: React.ReactNode }) {
  const {
    i18n: { language },
  } = await serverTranslation(["fip"]);

  return (
    <html lang={language} dir={dir(language)} className={`${notoSans.variable} ${lato.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta charSet="utf-8" />
        <link
          rel="shortcut icon"
          href={`${process.env.NEXT_PUBLIC_BASE_PATH}/favicon.ico`}
          type="image/x-icon"
          sizes="32x32"
        />
      </head>

      <body>
        <div className="flex min-h-full flex-col bg-gray-soft">
          <GcdsHeader language={language}>
            <div className="inline-block">
              <Logout className="mr-2 text-sm" />
            </div>
          </GcdsHeader>

          <div id="page-container" className="gc-authpages">
            <div className="account-wrapper mt-10 flex items-center justify-center">
              <div
                className={`rounded-2xl border-1 border-[#D1D5DB] bg-white p-10 tablet:w-[658px] has-[#auth-panel]:tablet:w-[658px] laptop:w-[850px]`}
              >
                <main id="content">
                  <Link
                    className="mb-6 mr-10 inline-flex no-underline focus:bg-white"
                    href={`/about`}
                  >
                    <span className="">
                      <SiteLogo />
                    </span>
                    <span className="ml-3 inline-block text-[24px] font-semibold leading-10 text-[#1B00C2]">
                      <I18n i18nKey="title" namespace="common" />
                    </span>
                  </Link>
                  <Tooltip.Provider>{children}</Tooltip.Provider>
                  <ToastContainer autoClose={false} containerId="default" />
                </main>
              </div>
            </div>
          </div>
          <Footer>
            <FooterLinks />
          </Footer>
        </div>
      </body>
    </html>
  );
}
