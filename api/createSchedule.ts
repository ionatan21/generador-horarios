import type { IncomingMessage, ServerResponse } from "http";
import crypto from "crypto";
import { db } from "../lib/firebase.js";
import { setCorsHeaders, isValidReferer } from "../lib/cors.js";
import { rateLimit } from "../lib/rateLimit.js";

/** Generates a random 8-character hex ID (4 bytes → 8 hex chars). */
function generateId(): string {
  return crypto.randomBytes(4).toString("hex");
}

/** Collects the full request body and parses it as JSON. */
function parseBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk: Buffer) => (data += chunk.toString()));
    req.on("end", () => {
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function json(res: ServerResponse, statusCode: number, body: unknown): void {
  res.setHeader("Content-Type", "application/json");
  res.statusCode = statusCode;
  res.end(JSON.stringify(body));
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  setCorsHeaders(req, res, "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (!isValidReferer(req)) {
    json(res, 403, { error: "Forbidden" });
    return;
  }

  const limited = await rateLimit(req, res, 10, 24 * 60 * 60 * 1000, 1);
  if (limited) return;

  if (req.method !== "POST") {
    json(res, 405, { error: "Method not allowed" });
    return;
  }

  let body: unknown;
  try {
    body = await parseBody(req);
  } catch {
    json(res, 400, { error: "Invalid request body" });
    return;
  }

  if (
    !body ||
    typeof body !== "object" ||
    !Array.isArray((body as Record<string, unknown>).schedule)
  ) {
    json(res, 400, { error: '"schedule" must be an array' });
    return;
  }

  const schedule = (body as Record<string, unknown>).schedule;

  try {
    const id = generateId();
    await db.collection("schedules").doc(id).set({
      schedule,
      createdAt: Date.now(),
    });

    json(res, 200, { id });
  } catch (err) {
    console.error("[createSchedule]", err);
    json(res, 500, { error: "Internal server error" });
  }
}
