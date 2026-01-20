import React, { type JSX } from "react";
import { cn } from "@lib/utils";

export interface TextInputProps {
  placeholder?: string;
  validationError?: string;
  value?: string;
}

export const TextInput = (
  props: TextInputProps & JSX.IntrinsicElements["input"]
): React.ReactElement => {
  const {
    id,
    type,
    className,
    required,
    placeholder,
    autoComplete,
    onChange,
    defaultValue = "",
  } = props;
  const classes = cn("gc-input-text", className);

  return (
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
    />
  );
};
