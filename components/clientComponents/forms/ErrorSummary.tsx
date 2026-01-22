"use client";
import React from "react";
import { cn } from "@lib/utils";
import { Alert, ErrorListItem, ErrorStatus } from "@clientComponents/forms";
import { useTranslation } from "@i18n";

export const ErrorSummary = ({
  id,
  validationErrors,
  className,
}: {
  id?: string;
  validationErrors?: { fieldKey: string; fieldValue: string }[];
  className?: string;
}): React.ReactElement => {
  const { t } = useTranslation();
  const classes = cn("w-full", className);

  return (
    <>
      {validationErrors && validationErrors.length > 0 && (
        <Alert
          className={classes}
          type={ErrorStatus.ERROR}
          validation={true}
          tabIndex={0}
          focussable={true}
          id={id ? id : "errorSummary"}
          heading={t("title", { ns: "errorSummary" })}
        >
          <ol className="gc-ordered-list p-0">
            {validationErrors.map(({ fieldKey, fieldValue }, index) => {
              return (
                <ErrorListItem
                  key={`error-${fieldKey}-${index}`}
                  errorKey={fieldKey}
                  value={fieldValue}
                />
              );
            })}
          </ol>
        </Alert>
      )}
    </>
  );
};
