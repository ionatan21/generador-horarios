import dotenv from "dotenv";
import type { IncomingMessage, ServerResponse } from "http";
dotenv.config();

export const getAllowedOrigins = () => {
  return (process.env.ALLOWED_ORIGINS || "https://class-grid-ucr.vercel.app")
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);
};

export const isValidReferer = (req: IncomingMessage) => {
  // En desarrollo se permite cualquier origen
  if (process.env.NODE_ENV !== "production") return true;

  const referer = req.headers.referer || req.headers.origin || "";
  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.some((o) => referer.startsWith(o));
};

export const setCorsHeaders = (req: IncomingMessage, res: ServerResponse, methods = "GET, OPTIONS") => {
  const origin = req.headers.origin;

  // En desarrollo se refleja cualquier origen
  if (process.env.NODE_ENV !== "production") {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
    res.setHeader("Vary", "Origin");
  } else {
    const allowedOrigins = getAllowedOrigins();
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
    } else {
      res.setHeader("Access-Control-Allow-Origin", "null");
    }
  }

  res.setHeader("Access-Control-Allow-Methods", methods);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};
