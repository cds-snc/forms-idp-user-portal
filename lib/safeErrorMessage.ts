type GetSafeErrorMessageParams = {
  error?: string;
  fallback: string;
  allowedMessages?: string[];
};

export const getSafeErrorMessage = ({
  error,
  fallback,
  allowedMessages = [],
}: GetSafeErrorMessageParams): string => {
  const normalizedError = error?.trim();

  if (!normalizedError) {
    return fallback;
  }

  return allowedMessages.includes(normalizedError) ? normalizedError : fallback;
};
