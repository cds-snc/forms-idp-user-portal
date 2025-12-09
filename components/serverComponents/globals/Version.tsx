import packageJson from "../../../package.json";
import { I18n } from "@i18n";

const deploymentId = process.env.NEXT_DEPLOYMENT_ID || "local";

export const Version = () => {
  const { version } = packageJson;

  return (
    <div className="mt-2 text-sm text-slate-800">
      <I18n i18nKey="version" namespace="layout />" />
      {version} <span className="hidden"> - {deploymentId}</span>
    </div>
  );
};
