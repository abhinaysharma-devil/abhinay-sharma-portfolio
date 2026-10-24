// server/visitorService.ts
import crypto from "crypto";

// server/db.ts
import { MongoClient } from "mongodb";
var client = null;
var clientPromise = null;
function getMongoUri() {
  return process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGO_URL || process.env.VITE_MONGODB_URI;
}
function isMongoConfigured() {
  const uri = getMongoUri();
  return Boolean(uri && uri.trim().length > 0 && !uri.includes("<username>"));
}
async function getMongoClient() {
  const uri = getMongoUri();
  if (!uri || !isMongoConfigured()) {
    return null;
  }
  if (client) {
    return client;
  }
  if (!clientPromise) {
    clientPromise = MongoClient.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5e3,
      connectTimeoutMS: 5e3
    }).then((connectedClient) => {
      client = connectedClient;
      return connectedClient;
    }).catch((err) => {
      clientPromise = null;
      console.warn("[MongoDB] Connection error:", err.message);
      return null;
    });
  }
  return clientPromise;
}
async function getDatabase() {
  try {
    const mongoClient = await getMongoClient();
    if (!mongoClient) return null;
    return mongoClient.db();
  } catch (err) {
    console.warn("[MongoDB] Failed to retrieve database:", err.message);
    return null;
  }
}
async function testMongoConnection() {
  const uri = getMongoUri();
  if (!uri || !isMongoConfigured()) {
    return {
      connected: false,
      message: "MongoDB URI is not configured yet. Using temporary in-memory storage."
    };
  }
  try {
    const db = await getDatabase();
    if (!db) {
      return {
        connected: false,
        message: "Could not connect to MongoDB. Check credentials or network access."
      };
    }
    await db.command({ ping: 1 });
    return { connected: true, message: "Connected to MongoDB successfully" };
  } catch (err) {
    return { connected: false, message: `MongoDB error: ${err.message}` };
  }
}

// server/visitorService.ts
var ADMIN_SECRET = process.env.ADMIN_JWT_SECRET || "abhinay-portfolio-admin-secret-2026";
function verifyAdminToken(token) {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, "base64").toString("utf8");
    const [payloadStr, signature] = decoded.split(".");
    if (!payloadStr || !signature) return false;
    const expectedSig = crypto.createHmac("sha256", ADMIN_SECRET).update(payloadStr).digest("hex");
    if (signature !== expectedSig) return false;
    const payload = JSON.parse(payloadStr);
    if (Date.now() > payload.expiresAt) return false;
    return true;
  } catch {
    return false;
  }
}

// server/crypto.ts
import crypto2 from "crypto";
var DEFAULT_SECRET = "abhinay-portfolio-secure-e2e-encryption-key-2026";
function getEncryptionKey() {
  const secret = process.env.API_SECRET_KEY || process.env.VITE_API_SECRET_KEY || process.env.ENCRYPTION_SECRET || DEFAULT_SECRET;
  return crypto2.createHash("sha256").update(secret).digest();
}
function encryptPayload(data) {
  const plainText = typeof data === "string" ? data : JSON.stringify(data);
  const key = getEncryptionKey();
  const iv = crypto2.randomBytes(12);
  const cipher = crypto2.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, tag, enc]);
  return combined.toString("base64");
}

// server/apiHandler.ts
function sendJsonResponse(res, statusCode, data, encrypt = false) {
  let responseBody = data;
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-token, x-admin-password, x-encrypted-payload",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS"
  };
  if (encrypt) {
    try {
      const encryptedBase64 = encryptPayload(data);
      responseBody = {
        encrypted: true,
        payload: encryptedBase64
      };
      headers["x-encrypted-payload"] = "true";
    } catch (err) {
      console.error("[API] Response encryption error:", err.message);
    }
  }
  for (const [k, v] of Object.entries(headers)) {
    try {
      res.setHeader(k, v);
    } catch {
    }
  }
  try {
    if (typeof res.status === "function" && typeof res.json === "function") {
      res.status(statusCode).json(responseBody);
      return;
    }
  } catch (err) {
  }
  const json = JSON.stringify(responseBody);
  try {
    res.statusCode = statusCode;
  } catch {
  }
  res.end(json);
}
function extractAuthToken(req) {
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  const tokenHeader = req.headers["x-admin-token"];
  if (tokenHeader && typeof tokenHeader === "string") {
    return tokenHeader.trim();
  }
  return null;
}
async function handleStatus(req, res) {
  const method = req.method?.toUpperCase();
  if (method === "OPTIONS") {
    sendJsonResponse(res, 204, {});
    return;
  }
  const wantsEncryption = req.headers["x-encrypted-payload"] === "true";
  try {
    const token = extractAuthToken(req);
    const isAuthenticated = verifyAdminToken(token);
    const mongoStatus = await testMongoConnection();
    sendJsonResponse(
      res,
      200,
      {
        success: true,
        isAuthenticated,
        isMongoConfigured: isMongoConfigured(),
        dbConnected: mongoStatus.connected,
        dbMessage: mongoStatus.message
      },
      wantsEncryption
    );
  } catch (err) {
    console.error("[API handleStatus error]:", err);
    sendJsonResponse(res, 500, { success: false, error: err.message }, wantsEncryption);
  }
}

// server/api/admin/status.ts
async function handler(req, res) {
  try {
    await handleStatus(req, res);
  } catch (err) {
    console.error("[API admin/status unhandled error]:", err);
    sendJsonResponse(res, 500, { success: false, error: err?.message || "Server error" });
  }
}
export {
  handler as default
};
