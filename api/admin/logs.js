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
var inMemoryLogs = [];
var seenIpsInMemory = /* @__PURE__ */ new Map();
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
async function getVisitorLogsAndStats(limit = 200) {
  const db = await getDatabase();
  if (db) {
    try {
      const collection = db.collection("visitor_logs");
      const logs = await collection.find({}).sort({ timestamp: -1 }).limit(limit).toArray();
      const totalVisits2 = await collection.countDocuments();
      const uniqueIps = await collection.distinct("ip");
      const uniqueVisitors2 = uniqueIps.length;
      const startOfToday2 = /* @__PURE__ */ new Date();
      startOfToday2.setHours(0, 0, 0, 0);
      const todayVisits2 = await collection.countDocuments({
        timestamp: { $gte: startOfToday2.toISOString() }
      });
      const browserAgg = await collection.aggregate([
        { $group: { _id: "$browser.name", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]).toArray();
      const topBrowsers2 = browserAgg.map((b) => ({ name: b._id || "Unknown", count: b.count }));
      const osAgg = await collection.aggregate([
        { $group: { _id: "$os.name", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]).toArray();
      const topOperatingSystems2 = osAgg.map((o) => ({ name: o._id || "Unknown", count: o.count }));
      const deviceAgg = await collection.aggregate([
        { $group: { _id: "$device.type", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray();
      const topDevices2 = deviceAgg.map((d) => ({ type: d._id || "Desktop", count: d.count }));
      const pathAgg = await collection.aggregate([
        { $group: { _id: "$path", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]).toArray();
      const topPaths2 = pathAgg.map((p) => ({ path: p._id || "/", count: p.count }));
      return {
        logs: logs.map((doc) => ({
          ...doc,
          id: doc._id?.toString()
        })),
        stats: {
          totalVisits: totalVisits2,
          uniqueVisitors: uniqueVisitors2,
          todayVisits: todayVisits2,
          topBrowsers: topBrowsers2,
          topOperatingSystems: topOperatingSystems2,
          topDevices: topDevices2,
          topPaths: topPaths2
        },
        isMongo: true
      };
    } catch (err) {
      console.warn("[MongoDB] Failed to query stats, falling back to in-memory:", err.message);
    }
  }
  const totalVisits = inMemoryLogs.length;
  const uniqueVisitors = seenIpsInMemory.size;
  const startOfToday = /* @__PURE__ */ new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayVisits = inMemoryLogs.filter(
    (l) => new Date(l.timestamp).getTime() >= startOfToday.getTime()
  ).length;
  const browserCounts = {};
  const osCounts = {};
  const deviceCounts = {};
  const pathCounts = {};
  for (const log of inMemoryLogs) {
    const bName = log.browser?.name || "Unknown";
    browserCounts[bName] = (browserCounts[bName] || 0) + 1;
    const oName = log.os?.name || "Unknown";
    osCounts[oName] = (osCounts[oName] || 0) + 1;
    const dType = log.device?.type || "Desktop";
    deviceCounts[dType] = (deviceCounts[dType] || 0) + 1;
    const path = log.path || "/";
    pathCounts[path] = (pathCounts[path] || 0) + 1;
  }
  const topBrowsers = Object.entries(browserCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  const topOperatingSystems = Object.entries(osCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  const topDevices = Object.entries(deviceCounts).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
  const topPaths = Object.entries(pathCounts).map(([path, count]) => ({ path, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  return {
    logs: inMemoryLogs.slice(0, limit),
    stats: {
      totalVisits,
      uniqueVisitors,
      todayVisits,
      topBrowsers,
      topOperatingSystems,
      topDevices,
      topPaths
    },
    isMongo: false
  };
}
async function clearAllLogs() {
  let count = 0;
  const db = await getDatabase();
  if (db) {
    try {
      const res = await db.collection("visitor_logs").deleteMany({});
      count = res.deletedCount || 0;
    } catch (err) {
      console.warn("[MongoDB] Clear logs error:", err.message);
    }
  }
  count += inMemoryLogs.length;
  inMemoryLogs.length = 0;
  seenIpsInMemory.clear();
  return { success: true, count };
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
async function handleLogs(req, res) {
  const method = req.method?.toUpperCase();
  if (method === "OPTIONS") {
    sendJsonResponse(res, 204, {});
    return;
  }
  const wantsEncryption = req.headers["x-encrypted-payload"] === "true";
  try {
    const token = extractAuthToken(req);
    if (!verifyAdminToken(token)) {
      sendJsonResponse(
        res,
        401,
        {
          success: false,
          message: "Unauthorized. Admin session expired or invalid."
        },
        wantsEncryption
      );
      return;
    }
    if (method === "DELETE") {
      const result = await clearAllLogs();
      sendJsonResponse(
        res,
        200,
        {
          success: true,
          message: `Cleared ${result.count} visitor records.`
        },
        wantsEncryption
      );
      return;
    }
    const url = req.url || "";
    const searchParams = new URL(url, "http://localhost").searchParams;
    const limit = parseInt(searchParams.get("limit") || "200", 10);
    const data = await getVisitorLogsAndStats(limit);
    const mongoStatus = await testMongoConnection();
    sendJsonResponse(
      res,
      200,
      {
        success: true,
        logs: data.logs,
        stats: data.stats,
        dbConnected: mongoStatus.connected,
        dbMessage: mongoStatus.message,
        isMongo: data.isMongo
      },
      wantsEncryption
    );
  } catch (err) {
    console.error("[API handleLogs error]:", err);
    sendJsonResponse(res, 500, { success: false, error: err.message }, wantsEncryption);
  }
}

// server/api/admin/logs.ts
async function handler(req, res) {
  try {
    await handleLogs(req, res);
  } catch (err) {
    console.error("[API admin/logs unhandled error]:", err);
    sendJsonResponse(res, 500, { success: false, error: err?.message || "Server error" });
  }
}
export {
  handler as default
};
