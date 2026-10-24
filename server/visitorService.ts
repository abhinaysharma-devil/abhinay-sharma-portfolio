import crypto from 'crypto';
import { getDatabase, isMongoConfigured, testMongoConnection } from './db';
import type { VisitorLog, VisitorStats } from '../types';

// In-memory fallback if MongoDB is not connected yet
const inMemoryLogs: VisitorLog[] = [];
const seenIpsInMemory = new Map<string, { count: number; firstSeen: string }>();

// Simple secret for admin token validation
const ADMIN_SECRET = process.env.ADMIN_JWT_SECRET || 'abhinay-portfolio-admin-secret-2026';


export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || 'admin123';
}

export function generateAdminToken(): string {
  const payload = {
    role: 'admin',
    createdAt: Date.now(),
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
  };
  const str = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', ADMIN_SECRET).update(str).digest('hex');
  return Buffer.from(`${str}.${signature}`).toString('base64');
}

export function verifyAdminToken(token?: string | null): boolean {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [payloadStr, signature] = decoded.split('.');
    if (!payloadStr || !signature) return false;
    
    const expectedSig = crypto.createHmac('sha256', ADMIN_SECRET).update(payloadStr).digest('hex');
    if (signature !== expectedSig) return false;
    
    const payload = JSON.parse(payloadStr);
    if (Date.now() > payload.expiresAt) return false;
    return true;
  } catch {
    return false;
  }
}

// User-Agent parser helper
export function parseUserAgent(ua: string = '') {
  let browser = { name: 'Unknown', version: '' };
  let os = { name: 'Unknown', version: '' };
  let deviceType: 'Desktop' | 'Mobile' | 'Tablet' | 'Unknown' = 'Desktop';

  // Device detection
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    deviceType = 'Tablet';
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
    deviceType = 'Mobile';
  } else {
    deviceType = 'Desktop';
  }

  // OS detection
  if (/Windows NT 10.0/i.test(ua)) os = { name: 'Windows', version: '10/11' };
  else if (/Windows NT 6.3/i.test(ua)) os = { name: 'Windows', version: '8.1' };
  else if (/Windows NT 6.2/i.test(ua)) os = { name: 'Windows', version: '8' };
  else if (/Windows NT 6.1/i.test(ua)) os = { name: 'Windows', version: '7' };
  else if (/Windows/i.test(ua)) os = { name: 'Windows', version: '' };
  else if (/Mac OS X 10[._](\d+)/i.test(ua)) {
    const match = ua.match(/Mac OS X 10[._](\d+)/i);
    os = { name: 'macOS', version: match ? `10.${match[1]}` : '' };
  } else if (/Macintosh|Mac OS X/i.test(ua)) os = { name: 'macOS', version: '' };
  else if (/Android (\d+(\.\d+)?)/i.test(ua)) {
    const match = ua.match(/Android (\d+(\.\d+)?)/i);
    os = { name: 'Android', version: match ? match[1] : '' };
  } else if (/iPhone OS (\d+[_.]\d+)/i.test(ua)) {
    const match = ua.match(/iPhone OS (\d+[_.]\d+)/i);
    os = { name: 'iOS', version: match ? match[1].replace('_', '.') : '' };
  } else if (/Linux/i.test(ua)) os = { name: 'Linux', version: '' };
  else if (/CrOS/i.test(ua)) os = { name: 'Chrome OS', version: '' };

  // Browser detection (order matters!)
  if (/Edg\/(\d+[\.\d]*)/i.test(ua)) {
    const match = ua.match(/Edg\/(\d+[\.\d]*)/i);
    browser = { name: 'Edge', version: match ? match[1].split('.')[0] : '' };
  } else if (/OPR\/(\d+[\.\d]*)|Opera/i.test(ua)) {
    const match = ua.match(/OPR\/(\d+[\.\d]*)/i);
    browser = { name: 'Opera', version: match ? match[1].split('.')[0] : '' };
  } else if (/Brave/i.test(ua)) {
    browser = { name: 'Brave', version: '' };
  } else if (/Chrome\/(\d+[\.\d]*)/i.test(ua)) {
    const match = ua.match(/Chrome\/(\d+[\.\d]*)/i);
    browser = { name: 'Chrome', version: match ? match[1].split('.')[0] : '' };
  } else if (/Firefox\/(\d+[\.\d]*)/i.test(ua)) {
    const match = ua.match(/Firefox\/(\d+[\.\d]*)/i);
    browser = { name: 'Firefox', version: match ? match[1].split('.')[0] : '' };
  } else if (/Safari\/(\d+[\.\d]*)/i.test(ua) && !/Chrome/i.test(ua)) {
    const match = ua.match(/Version\/(\d+[\.\d]*)/i);
    browser = { name: 'Safari', version: match ? match[1].split('.')[0] : '' };
  }

  return { browser, os, device: { type: deviceType } };
}

// Clean and normalize IP
export function cleanIp(rawIp?: string): string {
  if (!rawIp) return '127.0.0.1';
  // If comma separated list (e.g. x-forwarded-for: client, proxy1, proxy2)
  const first = rawIp.split(',')[0].trim();
  // Strip IPv6-mapped IPv4
  if (first.startsWith('::ffff:')) {
    return first.replace('::ffff:', '');
  }
  if (first === '::1') return '127.0.0.1';
  return first;
}

export async function recordVisitorLog(payload: Partial<VisitorLog>, rawHeaders: Record<string, any> = {}, socketIp?: string): Promise<{ success: boolean; log: VisitorLog; isUnique: boolean }> {
  // Extract real IP
  const headerIp =
    rawHeaders['x-forwarded-for'] ||
    rawHeaders['cf-connecting-ip'] ||
    rawHeaders['x-real-ip'] ||
    socketIp;

  // If local host and client sent their detected public IP, use it
  let ip = cleanIp(headerIp);
  if ((ip === '127.0.0.1' || ip === 'localhost') && payload.ip && payload.ip !== '127.0.0.1') {
    ip = cleanIp(payload.ip);
  } else if (!ip || ip === '') {
    ip = payload.ip ? cleanIp(payload.ip) : '127.0.0.1';
  }

  const userAgent = rawHeaders['user-agent'] || payload.userAgent || '';
  const parsedUa = parseUserAgent(userAgent);

  const nowIso = new Date().toISOString();

  // Extract Vercel geolocation headers if available
  const location = {
    country: rawHeaders['x-vercel-ip-country'] || payload.location?.country || undefined,
    city: rawHeaders['x-vercel-ip-city'] || payload.location?.city || undefined,
    region: rawHeaders['x-vercel-ip-country-region'] || payload.location?.region || undefined,
  };

  const db = await getDatabase();

  let isUniqueIp = true;
  let visitCount = 1;
  let firstVisitAt = nowIso;

  if (db) {
    try {
      const collection = db.collection<VisitorLog>('visitor_logs');
      
      // Check if this IP has visited before
      const previousLog = await collection.findOne({ ip }, { sort: { timestamp: 1 } });
      if (previousLog) {
        isUniqueIp = false;
        const totalPrevious = await collection.countDocuments({ ip });
        visitCount = totalPrevious + 1;
        firstVisitAt = previousLog.timestamp || previousLog.firstVisitAt || nowIso;
      }

      const logRecord: VisitorLog = {
        ip,
        isUniqueIp,
        visitCount,
        timestamp: nowIso,
        path: payload.path || '/',
        referrer: payload.referrer || 'Direct',
        browser: payload.browser?.name ? payload.browser : parsedUa.browser,
        os: payload.os?.name ? payload.os : parsedUa.os,
        device: payload.device?.type ? payload.device : parsedUa.device,
        screen: payload.screen || { width: 0, height: 0, resolution: 'Unknown' },
        viewport: payload.viewport || { width: 0, height: 0 },
        language: payload.language || rawHeaders['accept-language']?.split(',')[0] || 'Unknown',
        timezone: payload.timezone || 'Unknown',
        sessionId: payload.sessionId || '',
        userAgent,
        location: location.country ? location : payload.location,
        firstVisitAt,
        lastVisitAt: nowIso,
      };

      await collection.insertOne(logRecord as any);
      return { success: true, log: logRecord, isUnique: isUniqueIp };
    } catch (err: any) {
      console.warn('[MongoDB] Fallback to in-memory logging due to error:', err.message);
    }
  }

  // In-memory fallback
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

  const logRecord: VisitorLog = {
    id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ip,
    isUniqueIp,
    visitCount,
    timestamp: nowIso,
    path: payload.path || '/',
    referrer: payload.referrer || 'Direct',
    browser: payload.browser?.name ? payload.browser : parsedUa.browser,
    os: payload.os?.name ? payload.os : parsedUa.os,
    device: payload.device?.type ? payload.device : parsedUa.device,
    screen: payload.screen || { width: 0, height: 0, resolution: 'Unknown' },
    viewport: payload.viewport || { width: 0, height: 0 },
    language: payload.language || rawHeaders['accept-language']?.split(',')[0] || 'Unknown',
    timezone: payload.timezone || 'Unknown',
    sessionId: payload.sessionId || '',
    userAgent,
    location: location.country ? location : payload.location,
    firstVisitAt,
    lastVisitAt: nowIso,
  };

  inMemoryLogs.unshift(logRecord);
  if (inMemoryLogs.length > 500) {
    inMemoryLogs.pop();
  }

  return { success: true, log: logRecord, isUnique: isUniqueIp };
}

export async function getVisitorLogsAndStats(limit: number = 200): Promise<{ logs: VisitorLog[]; stats: VisitorStats; isMongo: boolean }> {
  const db = await getDatabase();

  if (db) {
    try {
      const collection = db.collection<VisitorLog>('visitor_logs');
      const logs = await collection.find({}).sort({ timestamp: -1 }).limit(limit).toArray();

      // Aggregate Stats
      const totalVisits = await collection.countDocuments();
      const uniqueIps = await collection.distinct('ip');
      const uniqueVisitors = uniqueIps.length;

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const todayVisits = await collection.countDocuments({
        timestamp: { $gte: startOfToday.toISOString() },
      });

      // Group by Browser
      const browserAgg = await collection.aggregate([
        { $group: { _id: '$browser.name', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]).toArray();
      const topBrowsers = browserAgg.map((b) => ({ name: b._id || 'Unknown', count: b.count }));

      // Group by OS
      const osAgg = await collection.aggregate([
        { $group: { _id: '$os.name', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]).toArray();
      const topOperatingSystems = osAgg.map((o) => ({ name: o._id || 'Unknown', count: o.count }));

      // Group by Device
      const deviceAgg = await collection.aggregate([
        { $group: { _id: '$device.type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).toArray();
      const topDevices = deviceAgg.map((d) => ({ type: d._id || 'Desktop', count: d.count }));

      // Group by Path
      const pathAgg = await collection.aggregate([
        { $group: { _id: '$path', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]).toArray();
      const topPaths = pathAgg.map((p) => ({ path: p._id || '/', count: p.count }));

      return {
        logs: logs.map(doc => ({
          ...doc,
          id: doc._id?.toString(),
        })),
        stats: {
          totalVisits,
          uniqueVisitors,
          todayVisits,
          topBrowsers,
          topOperatingSystems,
          topDevices,
          topPaths,
        },
        isMongo: true,
      };
    } catch (err: any) {
      console.warn('[MongoDB] Failed to query stats, falling back to in-memory:', err.message);
    }
  }

  // In-memory calculations
  const totalVisits = inMemoryLogs.length;
  const uniqueVisitors = seenIpsInMemory.size;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayVisits = inMemoryLogs.filter(
    (l) => new Date(l.timestamp).getTime() >= startOfToday.getTime()
  ).length;

  const browserCounts: Record<string, number> = {};
  const osCounts: Record<string, number> = {};
  const deviceCounts: Record<string, number> = {};
  const pathCounts: Record<string, number> = {};

  for (const log of inMemoryLogs) {
    const bName = log.browser?.name || 'Unknown';
    browserCounts[bName] = (browserCounts[bName] || 0) + 1;

    const oName = log.os?.name || 'Unknown';
    osCounts[oName] = (osCounts[oName] || 0) + 1;

    const dType = log.device?.type || 'Desktop';
    deviceCounts[dType] = (deviceCounts[dType] || 0) + 1;

    const path = log.path || '/';
    pathCounts[path] = (pathCounts[path] || 0) + 1;
  }

  const topBrowsers = Object.entries(browserCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topOperatingSystems = Object.entries(osCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topDevices = Object.entries(deviceCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  const topPaths = Object.entries(pathCounts)
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    logs: inMemoryLogs.slice(0, limit),
    stats: {
      totalVisits,
      uniqueVisitors,
      todayVisits,
      topBrowsers,
      topOperatingSystems,
      topDevices,
      topPaths,
    },
    isMongo: false,
  };
}

export async function clearAllLogs(): Promise<{ success: boolean; count: number }> {
  let count = 0;
  const db = await getDatabase();
  if (db) {
    try {
      const res = await db.collection('visitor_logs').deleteMany({});
      count = res.deletedCount || 0;
    } catch (err: any) {
      console.warn('[MongoDB] Clear logs error:', err.message);
    }
  }

  count += inMemoryLogs.length;
  inMemoryLogs.length = 0;
  seenIpsInMemory.clear();

  return { success: true, count };
}
