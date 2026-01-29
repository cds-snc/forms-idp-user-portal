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
        "hasLowercase"
      ),
      v.check(
        (password) => !requiresUppercase || containsUpperCaseCharacter(password),
        "hasUppercase"
      ),
      v.check((password) => !requiresNumber || containsNumber(password), "hasNumber"),
      v.check((password) => !requiresSymbol || containsSymbol(password), "hasSymbol")
    ),
  },
});

export const confirmPasswordSchema = () => ({
  ...{
    confirmPassword: v.pipe(v.string(), v.trim(), v.minLength(1, "requiredConfirmPassword")),
  },
});

export const codeSchema = () => ({
  ...{
    code: v.pipe(v.string(), v.trim(), v.minLength(1, "required"), v.length(6, "length")),
  },
});

export const usernameSchema = () => ({
  username: v.pipe(v.string(), v.trim(), v.minLength(1, "requiredUsername")),
});

// Shared "composed" validation functions using the above schemas

export const validateAccount = async (formEntries: { [k: string]: FormDataEntryValue }) => {
  const formValidationSchema = v.pipe(
    v.object({
      ...firstnameSchema(),
      ...lastnameSchema(),
      ...emailSchema(),
    })
  );
  return v.safeParse(formValidationSchema, formEntries, { abortPipeEarly: true });
};

export const validateUsername = async (formEntries: { [k: string]: FormDataEntryValue }) => {
  const formValidationSchema = v.pipe(
    v.object({
      ...usernameSchema(),
    })
  );
  return v.safeParse(formValidationSchema, formEntries, { abortPipeEarly: true });
};
