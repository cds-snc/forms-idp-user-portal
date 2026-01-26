import * as v from "valibot";
import {
  containsLowerCaseCharacter,
  containsNumber,
  containsSymbol,
  containsUpperCaseCharacter,
  isValidGovEmail,
} from "@lib/validators";

export const firstnameSchema = () => ({
  firstname: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "requiredFirstname")
    // TODO what about adding these "just encase" checks to all text fields?
    // v.maxLength(500, errorMessages["signUpRegistration.fields.name.error.maxLength"])
    // v.regex(/^[a-zA-Z\s'-]+$/, "First name can only contain letters, spaces, hyphens, and apostrophes")
  ),
});

export const lastnameSchema = () => ({
  lastname: v.pipe(v.string(), v.trim(), v.minLength(1, "requiredLastname")),
});

export const emailSchema = () => ({
  email: v.pipe(
    v.string(),
    v.toLowerCase(),
    v.trim(),
    v.minLength(1, "requiredEmail"),
    v.check((input) => isValidGovEmail(input), "validGovEmail")
  ),
});

// Password restrictions from Zitadel password settings
export const passwordSchema = ({
  minLength,
  requiresLowercase,
  requiresNumber,
  requiresSymbol,
  requiresUppercase,
}: {
  minLength?: number;
  requiresLowercase?: boolean;
  requiresNumber?: boolean;
  requiresSymbol?: boolean;
  requiresUppercase?: boolean;
}) => ({
  ...{
    password: v.pipe(
      v.string(),
      v.trim(),
      v.minLength(1, "requiredPassword"),
      v.check((password) => !minLength || password.length >= minLength, "minLength"),
      v.maxLength(50, "maxLength"),
      v.check(
        (password) => !requiresLowercase || containsLowerCaseCharacter(password),
        "oneLowerCase"
      ),
      v.check(
        (password) => !requiresUppercase || containsUpperCaseCharacter(password),
        "oneUpperCase"
      ),
      v.check((password) => !requiresNumber || containsNumber(password), "oneNumber"),
      v.check((password) => !requiresSymbol || containsSymbol(password), "oneSymbol")
    ),
  },
});

export const confirmPasswordSchema = () => ({
  ...{
    confirmPassword: v.pipe(v.string(), v.trim(), v.minLength(1, "requiredConfirmPassword")),
  },
});
