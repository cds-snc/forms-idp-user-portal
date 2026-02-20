import { serverTranslation } from "@i18n/server";
import packageJson from "../../../package.json";

const deploymentId = process.env.NEXT_DEPLOYMENT_ID || "local";

export const Version = async () => {
  const { version } = packageJson;

  const { t } = await serverTranslation(["footer"]);

  return (
    <div className="mt-2 text-sm text-slate-800">
      {t("version")} {version} <span className="hidden"> - {deploymentId}</span>
    </div>
  );
};
