/*--------------------------------------------*
 * Framework and Third-Party
 *--------------------------------------------*/
import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export * from "./base64";

// Type for Next.js page search params
export type SearchParams = Record<string | number | symbol, string | undefined>;

export function chunkArray<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  );
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getLocalizedProperty(field = "", lang = "en"): string {
  return field + lang.charAt(0).toUpperCase() + lang.slice(1);
}

export function dateHasPast(timestamp: number) {
  // Get the current time in UTC
  const now = new Date();

  // Compare utc time to timestamp
  if (now.getTime() > timestamp) {
    return true;
  }

  return false;
}

export function safeJSONParse<T>(...args: Parameters<typeof JSON.parse>): T | undefined {
  try {
    return JSON.parse(...args);
  } catch (e) {
    // Note: SyntaxError is the only error thrown by JSON.parse(). More info on specific errors:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/JSON_bad_parse

    // Why not just throw the error? NextJS will give an error about a non plain-object crossing
    // the server/client boundary.
    return undefined;
  }
}

/**
 * Recursively filters out non-serializable properties and returns a new, clean object.
 * @param {object} obj - The original object.
 * @returns {object} A new serializable object.
 */
export function getSerializableObject<T>(obj: T): T {
  // Use JSON.stringify with a replacer function to filter properties
  const jsonString = JSON.stringify(obj, (_, value) => {
    // Exclude functions and symbols by returning undefined

    if (typeof value === "function" || typeof value === "symbol") {
      return undefined;
    }
    // Handle other specific non-serializable types if necessary (e.g., DOM nodes)
    // if (value instanceof jQuery) { return undefined; }

    // For all other serializable values, return them as is
    return value;
  });

  // Parse the resulting JSON string back into a new JavaScript object
  // This new object is guaranteed to be serializable
  return JSON.parse(jsonString);
}

/**
 * Builds a URL with requestId as a query parameter if provided
 * @param {string} path - The base path for the URL
 * @param {string | undefined} requestId - Optional requestId to add as query parameter
 * @returns {string} The path with requestId query parameter if provided
 */
export function buildUrlWithRequestId(path: string, requestId?: string): string {
  if (!requestId) return path;
  const params = new URLSearchParams();
  params.set("requestId", requestId);
  return `${path}?${params.toString()}`;
}
