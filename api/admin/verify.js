// server/visitorService.ts
import crypto from "crypto";

// server/db.ts
import { MongoClient } from "mongodb";

// server/visitorService.ts
var ADMIN_SECRET = process.env.ADMIN_JWT_SECRET || "abhinay-portfolio-admin-secret-2026";
function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || "admin123";
}
function generateAdminToken() {
  const payload = {
    role: "admin",
    createdAt: Date.now(),
    expiresAt: Date.now() + 1e3 * 60 * 60 * 24 * 7
    // 7 days
  };
  const str = JSON.stringify(payload);
  const signature = crypto.createHmac("sha256", ADMIN_SECRET).update(str).digest("hex");
  return Buffer.from(`${str}.${signature}`).toString("base64");
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
function decryptPayload(base64Str) {
  const key = getEncryptionKey();
  const buf = Buffer.from(base64Str, "base64");
  if (buf.length < 28) {
    throw new Error("Invalid encrypted payload: too short");
  }
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ciphertext = buf.subarray(28);
  const decipher = crypto2.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  try {
    return JSON.parse(decrypted);
  } catch {
    return decrypted;
  }
}

// server/apiHandler.ts
async function parseJsonBody(req) {
  if (typeof req.body !== "undefined" && req.body !== null) {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
      }
    }
    if (body && body.encrypted === true && typeof body.payload === "string") {
      req.isClientEncrypted = true;
      try {
        return decryptPayload(body.payload);
      } catch (err) {
        console.error("[API] Decryption failure on pre-parsed body:", err.message);
        return { __decryptionError: true };
      }
    }
    return body;
  }
  if (req.readableEnded || req.complete) {
    return {};
  }
  return new Promise((resolve) => {
    let data = "";
    let isDone = false;
    const timer = setTimeout(() => {
      if (!isDone) {
        isDone = true;
        resolve({});
      }
    }, 2e3);
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      if (isDone) return;
      isDone = true;
      clearTimeout(timer);
      try {
        const parsed = data ? JSON.parse(data) : {};
        if (parsed && parsed.encrypted === true && typeof parsed.payload === "string") {
          req.isClientEncrypted = true;
          try {
            const decrypted = decryptPayload(parsed.payload);
            resolve(decrypted);
          } catch (err) {
            console.error("[API] Decryption failure:", err.message);
            resolve({ __decryptionError: true });
          }
        } else {
          resolve(parsed);
        }
      } catch {
        resolve({});
      }
    });
    req.on("error", () => {
      if (isDone) return;
      isDone = true;
      clearTimeout(timer);
      resolve({});
    });
  });
}
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
async function handleVerify(req, res) {
  const method = req.method?.toUpperCase();
  if (method === "OPTIONS") {
    sendJsonResponse(res, 204, {});
    return;
  }
  try {
    const body = await parseJsonBody(req);
    const wantsEncryption = req.headers["x-encrypted-payload"] === "true" || Boolean(req.isClientEncrypted);
    if (body?.__decryptionError) {
      sendJsonResponse(res, 400, { success: false, message: "Decryption failed" }, false);
      return;
    }
    const expectedPassword = getAdminPassword();
    const enteredPassword = body?.password;
    if (!enteredPassword || enteredPassword !== expectedPassword) {
      sendJsonResponse(
        res,
        401,
        {
          success: false,
          message: "Invalid password. Please check your credentials."
        },
        wantsEncryption
      );
      return;
    }
    const token = generateAdminToken();
    sendJsonResponse(
      res,
      200,
      {
        success: true,
        message: "Authenticated successfully",
        token
      },
      wantsEncryption
    );
  } catch (err) {
    console.error("[API handleVerify error]:", err);
    sendJsonResponse(res, 500, { success: false, message: err.message || "Server error" }, false);
  }
}

// server/api/admin/verify.ts
async function handler(req, res) {
  try {
    await handleVerify(req, res);
  } catch (err) {
    console.error("[API admin/verify unhandled error]:", err);
    sendJsonResponse(res, 500, { success: false, message: err?.message || "Server error" });
  }
}
export {
  handler as default
};
