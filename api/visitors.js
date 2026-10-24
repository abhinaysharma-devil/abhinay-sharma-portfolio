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

// server/visitorService.ts
var inMemoryLogs = [];
var seenIpsInMemory = /* @__PURE__ */ new Map();
var ADMIN_SECRET = process.env.ADMIN_JWT_SECRET || "abhinay-portfolio-admin-secret-2026";
function parseUserAgent(ua = "") {
  let browser = { name: "Unknown", version: "" };
  let os = { name: "Unknown", version: "" };
  let deviceType = "Desktop";
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    deviceType = "Tablet";
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
    deviceType = "Mobile";
  } else {
    deviceType = "Desktop";
  }
  if (/Windows NT 10.0/i.test(ua)) os = { name: "Windows", version: "10/11" };
  else if (/Windows NT 6.3/i.test(ua)) os = { name: "Windows", version: "8.1" };
  else if (/Windows NT 6.2/i.test(ua)) os = { name: "Windows", version: "8" };
  else if (/Windows NT 6.1/i.test(ua)) os = { name: "Windows", version: "7" };
  else if (/Windows/i.test(ua)) os = { name: "Windows", version: "" };
  else if (/Mac OS X 10[._](\d+)/i.test(ua)) {
    const match = ua.match(/Mac OS X 10[._](\d+)/i);
    os = { name: "macOS", version: match ? `10.${match[1]}` : "" };
  } else if (/Macintosh|Mac OS X/i.test(ua)) os = { name: "macOS", version: "" };
  else if (/Android (\d+(\.\d+)?)/i.test(ua)) {
    const match = ua.match(/Android (\d+(\.\d+)?)/i);
    os = { name: "Android", version: match ? match[1] : "" };
  } else if (/iPhone OS (\d+[_.]\d+)/i.test(ua)) {
    const match = ua.match(/iPhone OS (\d+[_.]\d+)/i);
    os = { name: "iOS", version: match ? match[1].replace("_", ".") : "" };
  } else if (/Linux/i.test(ua)) os = { name: "Linux", version: "" };
  else if (/CrOS/i.test(ua)) os = { name: "Chrome OS", version: "" };
  if (/Edg\/(\d+[\.\d]*)/i.test(ua)) {
    const match = ua.match(/Edg\/(\d+[\.\d]*)/i);
    browser = { name: "Edge", version: match ? match[1].split(".")[0] : "" };
  } else if (/OPR\/(\d+[\.\d]*)|Opera/i.test(ua)) {
    const match = ua.match(/OPR\/(\d+[\.\d]*)/i);
    browser = { name: "Opera", version: match ? match[1].split(".")[0] : "" };
  } else if (/Brave/i.test(ua)) {
    browser = { name: "Brave", version: "" };
  } else if (/Chrome\/(\d+[\.\d]*)/i.test(ua)) {
    const match = ua.match(/Chrome\/(\d+[\.\d]*)/i);
    browser = { name: "Chrome", version: match ? match[1].split(".")[0] : "" };
  } else if (/Firefox\/(\d+[\.\d]*)/i.test(ua)) {
    const match = ua.match(/Firefox\/(\d+[\.\d]*)/i);
    browser = { name: "Firefox", version: match ? match[1].split(".")[0] : "" };
  } else if (/Safari\/(\d+[\.\d]*)/i.test(ua) && !/Chrome/i.test(ua)) {
    const match = ua.match(/Version\/(\d+[\.\d]*)/i);
    browser = { name: "Safari", version: match ? match[1].split(".")[0] : "" };
  }
  return { browser, os, device: { type: deviceType } };
}
function cleanIp(rawIp) {
  if (!rawIp) return "127.0.0.1";
  const first = rawIp.split(",")[0].trim();
  if (first.startsWith("::ffff:")) {
    return first.replace("::ffff:", "");
  }
  if (first === "::1") return "127.0.0.1";
  return first;
}
async function recordVisitorLog(payload, rawHeaders = {}, socketIp) {
  const headerIp = rawHeaders["x-forwarded-for"] || rawHeaders["cf-connecting-ip"] || rawHeaders["x-real-ip"] || socketIp;
  let ip = cleanIp(headerIp);
  if ((ip === "127.0.0.1" || ip === "localhost") && payload.ip && payload.ip !== "127.0.0.1") {
    ip = cleanIp(payload.ip);
  } else if (!ip || ip === "") {
    ip = payload.ip ? cleanIp(payload.ip) : "127.0.0.1";
  }
  const userAgent = rawHeaders["user-agent"] || payload.userAgent || "";
  const parsedUa = parseUserAgent(userAgent);
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const location = {
    country: rawHeaders["x-vercel-ip-country"] || payload.location?.country || void 0,
    city: rawHeaders["x-vercel-ip-city"] || payload.location?.city || void 0,
    region: rawHeaders["x-vercel-ip-country-region"] || payload.location?.region || void 0
  };
  const db = await getDatabase();
  let isUniqueIp = true;
  let visitCount = 1;
  let firstVisitAt = nowIso;
  if (db) {
    try {
      const collection = db.collection("visitor_logs");
      const previousLog = await collection.findOne({ ip }, { sort: { timestamp: 1 } });
      if (previousLog) {
        isUniqueIp = false;
        const totalPrevious = await collection.countDocuments({ ip });
        visitCount = totalPrevious + 1;
        firstVisitAt = previousLog.timestamp || previousLog.firstVisitAt || nowIso;
      }
      const logRecord2 = {
        ip,
        isUniqueIp,
        visitCount,
        timestamp: nowIso,
        path: payload.path || "/",
        referrer: payload.referrer || "Direct",
        browser: payload.browser?.name ? payload.browser : parsedUa.browser,
        os: payload.os?.name ? payload.os : parsedUa.os,
        device: payload.device?.type ? payload.device : parsedUa.device,
        screen: payload.screen || { width: 0, height: 0, resolution: "Unknown" },
        viewport: payload.viewport || { width: 0, height: 0 },
        language: payload.language || rawHeaders["accept-language"]?.split(",")[0] || "Unknown",
        timezone: payload.timezone || "Unknown",
        sessionId: payload.sessionId || "",
        userAgent,
        location: location.country ? location : payload.location,
        firstVisitAt,
        lastVisitAt: nowIso
      };
      await collection.insertOne(logRecord2);
      return { success: true, log: logRecord2, isUnique: isUniqueIp };
    } catch (err) {
      console.warn("[MongoDB] Fallback to in-memory logging due to error:", err.message);
    }
  }
  const memData = seenIpsInMemory.get(ip);
  if (memData) {
    isUniqueIp = false;
    memData.count += 1;
    visitCount = memData.count;
    firstVisitAt = memData.firstSeen;
  } else {
    isUniqueIp = true;
    visitCount = 1;
    seenIpsInMemory.set(ip, { count: 1, firstSeen: nowIso });
  }
  const logRecord = {
    id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ip,
    isUniqueIp,
    visitCount,
    timestamp: nowIso,
    path: payload.path || "/",
    referrer: payload.referrer || "Direct",
    browser: payload.browser?.name ? payload.browser : parsedUa.browser,
    os: payload.os?.name ? payload.os : parsedUa.os,
    device: payload.device?.type ? payload.device : parsedUa.device,
    screen: payload.screen || { width: 0, height: 0, resolution: "Unknown" },
    viewport: payload.viewport || { width: 0, height: 0 },
    language: payload.language || rawHeaders["accept-language"]?.split(",")[0] || "Unknown",
    timezone: payload.timezone || "Unknown",
    sessionId: payload.sessionId || "",
    userAgent,
    location: location.country ? location : payload.location,
    firstVisitAt,
    lastVisitAt: nowIso
  };
  inMemoryLogs.unshift(logRecord);
  if (inMemoryLogs.length > 500) {
    inMemoryLogs.pop();
  }
  return { success: true, log: logRecord, isUnique: isUniqueIp };
}

// server/crypto.ts
import crypto from "crypto";
var DEFAULT_SECRET = "abhinay-portfolio-secure-e2e-encryption-key-2026";
function getEncryptionKey() {
  const secret = process.env.API_SECRET_KEY || process.env.VITE_API_SECRET_KEY || process.env.ENCRYPTION_SECRET || DEFAULT_SECRET;
  return crypto.createHash("sha256").update(secret).digest();
}
function encryptPayload(data) {
  const plainText = typeof data === "string" ? data : JSON.stringify(data);
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
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
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
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
async function handleVisitors(req, res) {
  const method = req.method?.toUpperCase();
  if (method === "OPTIONS") {
    sendJsonResponse(res, 204, {});
    return;
  }
  try {
    const body = await parseJsonBody(req);
    const wantsEncryption = req.headers["x-encrypted-payload"] === "true" || Boolean(req.isClientEncrypted);
    if (body?.__decryptionError) {
      sendJsonResponse(res, 400, { success: false, error: "Decryption failed" }, false);
      return;
    }
    const socketIp = req.socket?.remoteAddress;
    const result = await recordVisitorLog(body || {}, req.headers, socketIp);
    sendJsonResponse(res, 200, result, wantsEncryption);
  } catch (err) {
    console.error("[API handleVisitors error]:", err);
    sendJsonResponse(res, 500, { success: false, error: err.message }, false);
  }
}

// server/api/visitors.ts
async function handler(req, res) {
  try {
    await handleVisitors(req, res);
  } catch (err) {
    console.error("[API visitors unhandled error]:", err);
    sendJsonResponse(res, 500, { success: false, error: err?.message || "Server error" });
  }
}
export {
  handler as default
};
