import { NextResponse } from "next/server";

import { VERSION } from "@lib/version";

export function GET() {
  return new NextResponse(VERSION, {
    status: 200,
    headers: { "content-type": "text/plain" },
  });
}
