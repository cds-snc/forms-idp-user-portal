// Error codes for U2F operations
export const U2F_ERRORS = {
  SESSION_NOT_FOUND: "set.errors.sessionNotFound",
  CREDENTIAL_REGISTRATION_FAILED: "set.errors.credentialRegistrationFailed",
  CREDENTIAL_CREATION_FAILED: "set.errors.credentialCreationFailed",
  INVALID_CREDENTIAL_OPTIONS: "set.errors.invalidCredentialOptions",
  VERIFICATION_FAILED: "set.errors.verificationFailed",
  VERIFICATION_CANCELLED: "set.errors.verificationCancelled",
  SESSION_VERIFICATION_FAILED: "set.errors.sessionVerificationFailed",
  CREDENTIAL_ALREADY_REGISTERED: "set.errors.credentialAlreadyRegistered",
} as const;
