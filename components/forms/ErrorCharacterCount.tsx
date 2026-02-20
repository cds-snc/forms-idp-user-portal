import React from "react";
import { useTranslation } from "@i18n/client";

// TODO will use in password and other forms
// TOOD use passed in valibot state for min max checking and just show or not

export const ErrorCharacterCount = ({
  id,
  maxLength,
}: {
  id: string;
  maxLength?: number;
}): React.ReactElement => {
  const { t } = useTranslation("common");

  const remainingCharacters = maxLength ?? 0;

  const characterCountMessages = {
    part1: t("formElements.characterCount.part1"),
    part2: t("formElements.characterCount.part2"),
    part1Error: t("formElements.characterCount.part1-error"),
    part2Error: t("formElements.characterCount.part2-error"),
  };

  const remainingCharactersMessage =
    characterCountMessages.part1 + " " + remainingCharacters + " " + characterCountMessages.part2;

  const tooManyCharactersMessage =
    characterCountMessages.part1Error +
    " " +
    remainingCharacters * -1 +
    " " +
    characterCountMessages.part2Error;

  return (
    <>
      {characterCountMessages &&
        maxLength &&
        remainingCharacters < maxLength * 0.25 &&
        remainingCharacters >= 0 && (
          <div id={"characterCountMessage" + id} aria-live="polite">
            {remainingCharactersMessage}
          </div>
        )}
      {characterCountMessages && maxLength && remainingCharacters < 0 && (
        <div id={"characterCountMessage" + id} className="gc-error-message" aria-live="polite">
          {tooManyCharactersMessage}
        </div>
      )}
    </>
  );
};
