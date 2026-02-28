import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { createRequire } from "module";
import { existsSync } from "fs";

let serviceAccount;

// Local: leer desde archivo
const keyPath = new URL("../serviceAccountKey.json", import.meta.url);
if (existsSync(keyPath)) {
  const require = createRequire(import.meta.url);
  serviceAccount = require("../serviceAccountKey.json");
} else {
  // Vercel: pegar el JSON en una sola línea como variable de entorno
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT ?? "");
}

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

export { db };
