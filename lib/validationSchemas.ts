import * as v from "valibot";
import {
  // containsLowerCaseCharacter,
  // containsNumber,
  // containsSymbol,
  // containsUpperCaseCharacter,
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

//TODO
/*
const passwordSchema = () => ({
  ...{
    password: v.pipe(
      v.string(),
      v.trim(),
      v.minLength(1, errorMessages["input-validation.required"]),
      v.minLength(8, errorMessages["account.fields.password.error.minLength"]),
      v.maxLength(50, errorMessages["account.fields.password.error.maxLength"]),
      v.check(
        (password) => containsLowerCaseCharacter(password),
        errorMessages["account.fields.password.error.oneLowerCase"]
      ),
      v.check(
        (password) => containsUpperCaseCharacter(password),
        errorMessages["account.fields.password.error.oneUpperCase"]
      ),
      v.check(
        (password) => containsNumber(password),
        errorMessages["account.fields.password.error.oneNumber"]
      ),
      v.check(
        (password) => containsSymbol(password),
        errorMessages["account.fields.password.error.oneSymbol"]
      )
    ),
  },
  ...{
    passwordConfirmation: v.pipe(
      v.string(),
      v.trim(),
      v.minLength(1, errorMessages["input-validation.required"])
    ),
  },
});
*/
