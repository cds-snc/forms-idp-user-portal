import {
  containsLowerCaseCharacter,
  containsNumber,
  containsSymbol,
  containsUpperCaseCharacter,
  isValidGovEmail,
} from "@lib/validators";
import * as v from "valibot";

export const validateAccount = async (
  formEntries: {
    [k: string]: FormDataEntryValue;
  },
  errorMessages: { [key: string]: string }
) => {
  const formValidationSchema = v.pipe(
    v.object({
      firstname: v.pipe(
        v.string(),
        v.trim(),
        v.minLength(1, errorMessages["errors.validation.requiredFirstname"])
        // TODO what about adding these "just encase" checks to all text fields?
        // v.maxLength(500, errorMessages["signUpRegistration.fields.name.error.maxLength"])
        // v.regex(/^[a-zA-Z\s'-]+$/, "First name can only contain letters, spaces, hyphens, and apostrophes")
      ),
      lastname: v.pipe(
        v.string(),
        v.trim(),
        v.minLength(1, errorMessages["errors.validation.requiredLastname"])
      ),
      email: v.pipe(
        v.string(),
        v.toLowerCase(),
        v.trim(),
        v.minLength(1, errorMessages["errors.validation.requiredEmail"]),
        v.check((input) => isValidGovEmail(input), errorMessages["errors.validation.validGovEmail"])
      ),
    })
  );
  return v.safeParse(formValidationSchema, formEntries, { abortPipeEarly: true });
};

// TODO WIP needs to be implemented
export const validatePassword = async (
  formEntries: {
    [k: string]: FormDataEntryValue;
  },
  errorMessages: { [key: string]: string }
) => {
  const formValidationSchema = v.pipe(
    v.object({
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
      passwordConfirmation: v.pipe(
        v.string(),
        v.trim(),
        v.minLength(1, errorMessages["input-validation.required"])
      ),
    }),
    v.forward(
      v.check(
        (input) => input.password === input.passwordConfirmation,
        errorMessages["account.fields.passwordConfirmation.error.mustMatch"]
      ),
      ["passwordConfirmation"]
    )
  );
  return v.safeParse(formValidationSchema, formEntries, { abortPipeEarly: true });
};
