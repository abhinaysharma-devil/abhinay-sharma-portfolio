import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { secureApiFetch } from '../utils/apiClient';

function getOrCreateSessionId(): string {
  try {
    let sid = window.sessionStorage.getItem('visitor_session_id');
    if (!sid) {
      sid = 'sess_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      window.sessionStorage.setItem('visitor_session_id', sid);
    }
    return sid;
  } catch {
    return 'sess_' + Math.random().toString(36).substring(2, 10);
  }
}

// Cached client IP so we only query external IP service once per session if needed
let cachedClientIp: string | null = null;

async function detectClientIp(): Promise<string | undefined> {
  if (cachedClientIp) return cachedClientIp;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1200);
    const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (data?.ip) {
        cachedClientIp = data.ip;
        return data.ip;
      }
    }
  } catch {
    // Ignore fetch error or timeout, backend will use request IP headers
  }
  return undefined;
}

export function useVisitorTracker() {
  const location = useLocation();
  const lastTrackedPathRef = useRef<string>('');
  const lastTrackedTimeRef = useRef<number>(0);

  useEffect(() => {
    const currentPath = location.pathname;

    // Do NOT log admin route visits
    if (currentPath.startsWith('/admin')) {
      return;
    }

    // Debounce duplicate tracking on fast re-renders
    const now = Date.now();
    if (lastTrackedPathRef.current === currentPath && now - lastTrackedTimeRef.current < 2000) {
      return;
    }

    lastTrackedPathRef.current = currentPath;
    lastTrackedTimeRef.current = now;

    const logVisit = async () => {
      try {
        const clientIp = await detectClientIp();
        const sessionId = getOrCreateSessionId();

        const payload = {
          ip: clientIp,
          path: currentPath,
          referrer: document.referrer ? document.referrer : 'Direct',
          screen: {
            width: window.screen.width,
            height: window.screen.height,
            resolution: `${window.screen.width}x${window.screen.height}`,
          },
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
          language: navigator.language || 'en',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          userAgent: navigator.userAgent,
          sessionId,
        };

        await secureApiFetch('/api/visitors', {
          method: 'POST',
          body: JSON.stringify(payload),
          keepalive: true,
        });
      } catch (err) {
        // Silently swallow client tracking network errors
      }
    };

    logVisit();
  }, [location.pathname]);
}
