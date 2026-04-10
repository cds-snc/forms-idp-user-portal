export const dynamic = "force-static";

// Prefer GIT_SHA if it is available and fallback to the build timestamp
// This provides a stable version string for each build
const VERSION = process.env.GIT_SHA ?? new Date().toISOString();

export function GET() {
  return new Response(VERSION, {
    headers: { "content-type": "text/plain" },
  });
}
