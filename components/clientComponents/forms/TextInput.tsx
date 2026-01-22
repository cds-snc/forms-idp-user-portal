import React from "react";
import { cn } from "@lib/utils";
import { type JSX } from "react";

export const TextInput = ({
  id,
  type,
  className,
  required,
  placeholder,
  autoComplete,
  ariaDescribedbyIds,
  onChange,
  defaultValue = "",
  validationError,
}: {
  id: string;
  type: string;
  className?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  ariaDescribedbyIds?: string[];
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  defaultValue?: string;
  validationError: JSX.Element | string | null;
}): React.ReactElement => {
  const classes = cn("gc-input-text", className);

  return (
    <>
      {validationError && validationError}
      <input
        data-testid="textInput"
        className={classes}
        id={id}
        name={id}
        type={type}
        required={required}
        autoComplete={autoComplete ? autoComplete : "off"}
        placeholder={placeholder}
        defaultValue={defaultValue}
        onChange={onChange}
        {...(ariaDescribedbyIds && { "aria-describedby": ariaDescribedbyIds.join(" ") })}
      />
    </>
  );
};
