import "server-only";

import { NextResponse } from "next/server";

/**
 * Same-origin guard for the write routes. Browsers always send `Origin` on a cross-site POST, so a
 * mismatch (or a missing header on a state-changing request) is refused before any work is done.
 * JSON-only bodies add a second layer: a plain HTML form cannot send `application/json`.
 */
export function rejectCrossSite(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");

  let originHost: string | null = null;
  try {
    originHost = origin ? new URL(origin).host : null;
  } catch {
    originHost = null;
  }

  if (!originHost || !host || originHost !== host) {
    return NextResponse.json({ error: "Cross-site request refused." }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 415 });
  }

  return null;
}

/** Reads a JSON body with a hard size cap, so a huge payload is rejected before parsing. */
export async function readJson(request: Request, maxBytes = 8_192): Promise<unknown> {
  const text = await request.text();
  if (new TextEncoder().encode(text).length > maxBytes) {
    throw new PayloadTooLargeError();
  }
  return text ? JSON.parse(text) : {};
}

export class PayloadTooLargeError extends Error {}
