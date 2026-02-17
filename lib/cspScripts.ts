import { randomUUID } from "crypto";

/**
 * Generates a Content Security Policy header with a nonce for inline scripts and styles.
 * This prevents XSS attacks by requiring all inline scripts/styles to have a matching nonce.
 *
 * @returns Object containing CSP header string and base64-encoded nonce
 */
export const generateCSP = (): { csp: string; nonce: string } => {
  // Generate a random nonce and base64 encode it
  const nonce = Buffer.from(randomUUID()).toString("base64");

  // Construct CSP header with nonce
  // script-src 'strict-dynamic' enables the browser to ignore unsafe-inline for scripts with nonce
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'wasm-unsafe-eval' 'strict-dynamic';
    style-src 'self' 'nonce-${nonce}';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    connect-src 'self';
    block-all-mixed-content;
    upgrade-insecure-requests;
  `;

  // Normalize whitespace and return
  return {
    csp: cspHeader.replace(/\s{2,}/g, " ").trim(),
    nonce,
  };
};
