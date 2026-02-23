/*--------------------------------------------*
 * Framework and Third-Party
 *--------------------------------------------*/
import React from "react";

/*--------------------------------------------*
 * Internal Aliases
 *--------------------------------------------*/
import { cn } from "@lib/utils";
import { useTranslation } from "@i18n";
import { Alert, ErrorListItem, ErrorStatus } from "@components/ui/form";
export const ErrorSummary = ({
  id,
  validationErrors,
  className,
}: {
  id?: string;
  validationErrors?: { fieldKey: string; fieldValue: string }[];
  className?: string;
}): React.ReactElement => {
  const { t } = useTranslation(["common"]);
  const classes = cn("w-full", className);

  const getSafeSummaryMessage = (fieldValue?: string): string => {
    const trimmedValue = fieldValue?.trim();

    if (!trimmedValue) {
      return t("errorSummary.itemFallback");
    }

    const looksLikeTranslationKey = /^[a-z][a-zA-Z0-9]*(?:[._-][a-zA-Z0-9]+)+$/.test(trimmedValue);

    if (looksLikeTranslationKey) {
      return t("errorSummary.itemFallback");
    }

    return trimmedValue;
  };

  return (
    <>
      {Array.isArray(validationErrors) && validationErrors.length > 0 && (
        <Alert
          className={classes}
          type={ErrorStatus.ERROR}
          validation={true}
          tabIndex={0}
          focussable={true}
          id={id ? id : "errorSummary"}
          heading={t("errorSummary.title")}
        >
          <ol className="gc-ordered-list p-0">
            {validationErrors.map(({ fieldKey, fieldValue }, index) => {
              return (
                <ErrorListItem
                  key={`error-${fieldKey}-${index}`}
                  errorKey={fieldKey}
                  value={getSafeSummaryMessage(fieldValue)}
                />
              );
            })}
          </ol>
        </Alert>
      )}
    </>
  );
};
