import crypto from "crypto";
import type { IncomingMessage, ServerResponse } from "http";
import { db } from "./firebase.js";

// Cache en memoria de IPs bloqueadas: key (hash) -> blockedUntil (timestamp)
const blockedIpsCache = new Map<string, number>();
const BLOCK_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas

const isIPBlocked = (key: string): boolean => {
  const blockedUntil = blockedIpsCache.get(key);
  if (!blockedUntil) return false;
  if (Date.now() > blockedUntil) {
    blockedIpsCache.delete(key);
    return false;
  }
  return true;
};

// Cache en memoria de IPs con rate limit activo: key (hash) -> expiresAt (timestamp)
const rateLimitedIpsCache = new Map<string, number>();

const isIPRateLimited = (key: string): boolean => {
  const expiresAt = rateLimitedIpsCache.get(key);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    rateLimitedIpsCache.delete(key);
    return false;
  }
  return true;
};

/**
 * Convierte una IP en un hash SHA-256 para no almacenar la IP real.
 */
const hashIp = (ip: string): string => {
  return crypto.createHash("sha256").update(ip).digest("hex");
};

/**
 * Extrae la IP del request.
 */
const getIp = (req: IncomingMessage & { connection?: { remoteAddress?: string } }): string => {
  const forwarded = req.headers["x-forwarded-for"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return (raw || req.connection?.remoteAddress || "").split(",")[0].trim();
};

function sendJson(res: ServerResponse, statusCode: number, body: unknown): void {
  res.setHeader("Content-Type", "application/json");
  res.statusCode = statusCode;
  res.end(JSON.stringify(body));
}

/**
 * Rate limiter persistente usando Firestore.
 *
 * @param req       - Node IncomingMessage
 * @param res       - Node ServerResponse
 * @param limit     - Máximo de solicitudes permitidas en la ventana
 * @param resetTime - Duración de la ventana en ms
 * @param newcount  - Incremento por solicitud (normalmente 1)
 * @returns true si la solicitud fue bloqueada (respuesta ya enviada), null si OK
 */
export async function rateLimit(
  req: IncomingMessage,
  res: ServerResponse,
  limit = 10,
  resetTime: number,
  newcount: number,
): Promise<true | null> {
  const ip = getIp(req);
  const key = hashIp(ip);
  const now = Date.now();

  // Verificar caches antes de consultar Firestore
  if (isIPBlocked(key)) {
    sendJson(res, 403, { error: "Acceso denegado" });
    return true;
  }
  if (isIPRateLimited(key)) {
    sendJson(res, 429, { error: "Límite de solicitudes alcanzado. Inténtalo mañana." });
    return true;
  }

  const docRef = db.collection("rate-limit").doc(key);
  const snap = await docRef.get();

  if (!snap.exists) {
    // Primera solicitud de esta IP
    await docRef.set({ count: newcount, firstRequest: now });
    return null;
  }

  const data = snap.data()!;

  if (now - data.firstRequest > resetTime) {
    // Ventana expirada, reiniciar
    await docRef.set({ count: newcount, firstRequest: now });
    return null;
  } else if (data.count >= limit) {
    // Guardar en cache hasta que expire la ventana
    rateLimitedIpsCache.set(key, data.firstRequest + resetTime);
    sendJson(res, 429, { error: "Límite de solicitudes alcanzado. Inténtalo mañana." });
    return true;
  }

  // Incrementar contador
  await docRef.set({
    count: data.count + newcount,
    firstRequest: data.firstRequest,
  });
  return null;
}

export async function BlockIP(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const ip = getIp(req);
  const key = hashIp(ip);
  const now = Date.now();

  // Guardar en cache y en Firestore
  blockedIpsCache.set(key, now + BLOCK_CACHE_TTL);
  const docRef = db.collection("rate-limit").doc(key);
  await docRef.set({ count: 20, firstRequest: now });
  sendJson(res, 403, { error: "Acceso denegado" });
}