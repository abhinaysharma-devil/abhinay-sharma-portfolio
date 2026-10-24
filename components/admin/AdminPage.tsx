import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  RefreshCw,
  Search,
  Globe,
  Users,
  Calendar,
  Monitor,
  Smartphone,
  Tablet,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  Download,
  Trash2,
  Code,
  X,
  ExternalLink,
  Laptop,
} from 'lucide-react';
import { VisitorLog, VisitorStats } from '../../types';
import { secureApiFetch } from '../../utils/apiClient';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return Boolean(window.sessionStorage.getItem('admin_token'));
    } catch {
      return false;
    }
  });

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard state
  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMongo, setIsMongo] = useState(false);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [dbMessage, setDbMessage] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedLog, setSelectedLog] = useState<VisitorLog | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unique' | 'repeat' | 'today'>('all');

  const token = typeof window !== 'undefined' ? window.sessionStorage.getItem('admin_token') : null;

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setLoginError('Please enter the password.');
      return;
    }

    setIsLoggingIn(true);
    setLoginError('');

    try {
      const res = await secureApiFetch('/api/admin/verify', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });

      const data = res.data;
      if (res.ok && data?.success && data?.token) {
        window.sessionStorage.setItem('admin_token', data.token);
        setIsAuthenticated(true);
        setPassword('');
      } else {
        setLoginError(data?.message || 'Invalid password. Please try again.');
      }
    } catch (err: any) {
      setLoginError('Could not connect to authentication server. Please check your network.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    window.sessionStorage.removeItem('admin_token');
    setIsAuthenticated(false);
    setLogs([]);
    setStats(null);
  };

  // Fetch logs and stats
  const fetchLogs = useCallback(async () => {
    const currentToken = window.sessionStorage.getItem('admin_token');
    if (!currentToken) return;

    setIsLoading(true);
    try {
      const res = await secureApiFetch('/api/admin/logs?limit=250', {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      const data = res.data;
      if (data?.success) {
        setLogs(data.logs || []);
        setStats(data.stats || null);
        setIsMongo(data.isMongo || false);
        setDbConnected(data.dbConnected);
        setDbMessage(data.dbMessage || '');
      }
    } catch (err) {
      console.error('Failed to fetch visitor logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch and auto-refresh
  useEffect(() => {
    if (isAuthenticated) {
      fetchLogs();
    }
  }, [isAuthenticated, fetchLogs]);

  useEffect(() => {
    if (!isAuthenticated || !autoRefresh) return;
    const interval = setInterval(() => {
      fetchLogs();
    }, 12000);
    return () => clearInterval(interval);
  }, [isAuthenticated, autoRefresh, fetchLogs]);

  // Clear logs handler
  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to delete all visitor logs? This cannot be undone.')) {
      return;
    }
    const currentToken = window.sessionStorage.getItem('admin_token');
    try {
      const res = await secureApiFetch('/api/admin/logs', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });
      if (res.ok) {
        fetchLogs();
      }
    } catch (err) {
      alert('Failed to clear logs.');
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (!logs.length) return;
    const headers = [
      'Timestamp',
      'IP',
      'IsUnique',
      'VisitCount',
      'Path',
      'Referrer',
      'Browser',
      'BrowserVersion',
      'OS',
      'DeviceType',
      'ScreenResolution',
      'Viewport',
      'Language',
      'Timezone',
      'UserAgent',
    ];

    const rows = logs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.ip}"`,
      `"${l.isUniqueIp}"`,
      `"${l.visitCount}"`,
      `"${l.path}"`,
      `"${l.referrer || ''}"`,
      `"${l.browser?.name || ''}"`,
      `"${l.browser?.version || ''}"`,
      `"${l.os?.name || ''}"`,
      `"${l.device?.type || ''}"`,
      `"${l.screen?.resolution || ''}"`,
      `"${l.viewport?.width}x${l.viewport?.height}"`,
      `"${l.language || ''}"`,
      `"${l.timezone || ''}"`,
      `"${(l.userAgent || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `visitor_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered logs
  const filteredLogs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    return logs.filter((log) => {
      // Type filter
      if (filterType === 'unique' && !log.isUniqueIp) return false;
      if (filterType === 'repeat' && log.isUniqueIp) return false;
      if (filterType === 'today') {
        const logTime = new Date(log.timestamp).getTime();
        if (logTime < startOfToday.getTime()) return false;
      }

      // Query filter
      if (!q) return true;
      const ip = (log.ip || '').toLowerCase();
      const path = (log.path || '').toLowerCase();
      const bName = (log.browser?.name || '').toLowerCase();
      const osName = (log.os?.name || '').toLowerCase();
      const country = (log.location?.country || '').toLowerCase();
      const city = (log.location?.city || '').toLowerCase();
      const ref = (log.referrer || '').toLowerCase();

      return (
        ip.includes(q) ||
        path.includes(q) ||
        bName.includes(q) ||
        osName.includes(q) ||
        country.includes(q) ||
        city.includes(q) ||
        ref.includes(q)
      );
    });
  }, [logs, searchQuery, filterType]);

  // Format relative time
  const formatRelativeTime = (timestamp: string) => {
    try {
      const now = Date.now();
      const time = new Date(timestamp).getTime();
      const diffSec = Math.floor((now - time) / 1000);

      if (diffSec < 10) return 'Just now';
      if (diffSec < 60) return `${diffSec}s ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return timestamp;
    }
  };

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType) {
      case 'Mobile':
        return <Smartphone size={15} className="text-emerald-400" />;
      case 'Tablet':
        return <Tablet size={15} className="text-amber-400" />;
      default:
        return <Monitor size={15} className="text-blue-400" />;
    }
  };

  // -------------------------------------------------------------
  // 1. Password Protected Login View
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#07090d] text-slate-100 flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-black">
        {/* Ambient glow backgrounds */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[140px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative w-full max-w-md bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400 mb-4 shadow-lg shadow-emerald-500/10">
              <Shield size={32} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-2 font-['Manrope']">
              Admin Portal
            </h1>
            <p className="text-sm text-slate-400">
              Enter password to access visitor logs & portfolio telemetry.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                Administrator Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password..."
                  autoFocus
                  required
                  className="w-full pl-10 pr-11 py-3 bg-slate-950/70 border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 focus:outline-none transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 px-4 rounded-xl font-medium text-sm text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 active:scale-[0.99] transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Lock size={16} />
                  <span>Unlock Admin Panel</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800/80 text-center flex items-center justify-between text-xs text-slate-500">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 hover:text-slate-300 transition-colors"
            >
              <ArrowLeft size={13} /> Back to Portfolio
            </Link>
            <span className="font-mono text-[11px] text-slate-600">
              Protected Endpoint
            </span>
          </div>

          <div className="mt-4 p-3 bg-slate-950/40 border border-slate-800/40 rounded-lg text-[11px] text-slate-400 font-mono text-center">
            💡 Default password is <span className="text-emerald-400 font-bold">admin123</span> (Configure in <code className="text-slate-300">.env.local</code>)
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. Authenticated Admin View (Single Tab: Visitor Logs)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#07090d] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: Brand & Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Shield size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm sm:text-base font-['Manrope']">
                  Abhinay Sharma
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Portfolio Visitor Analytics
              </p>
            </div>
          </div>

          {/* Center: Tabs (Only ONE tab as requested: Visitor Logs) */}
          <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1">
            <button
              className="px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all cursor-default shadow-sm"
              title="Visitor Logs Tab"
            >
              <Users size={14} />
              <span>Visitor Logs</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-500/30 text-emerald-200">
                {stats?.totalVisits ?? logs.length}
              </span>
            </button>
          </div>

          {/* Right: Status & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Encryption Status Badge */}
            <div
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border bg-cyan-500/10 text-cyan-300 border-cyan-500/20"
              title="End-to-End Encrypted using AES-256-GCM"
            >
              <Lock size={12} className="text-cyan-400" />
              <span>AES-256-GCM</span>
            </div>

            {/* DB Status Badge */}
            <div
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border ${
                dbConnected
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
              }`}
              title={dbMessage || (dbConnected ? 'MongoDB Live' : 'Using In-Memory Fallback')}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  dbConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span>{dbConnected ? 'MongoDB Live' : 'Memory Mode'}</span>
            </div>

            {/* Auto refresh toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded-lg text-xs border transition-colors hidden sm:flex items-center gap-1.5 ${
                autoRefresh
                  ? 'bg-slate-900 text-slate-300 border-slate-700'
                  : 'bg-slate-950 text-slate-500 border-slate-800'
              }`}
              title={autoRefresh ? 'Auto-refresh active (12s)' : 'Auto-refresh paused'}
            >
              <RefreshCw
                size={14}
                className={autoRefresh && isLoading ? 'animate-spin text-emerald-400' : ''}
              />
              <span className="text-[11px]">{autoRefresh ? 'Live' : 'Paused'}</span>
            </button>

            {/* Manual Refresh */}
            <button
              onClick={fetchLogs}
              disabled={isLoading}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
              title="Refresh logs now"
            >
              <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            </button>

            {/* View Portfolio */}
            <Link
              to="/"
              target="_blank"
              className="hidden lg:flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
            >
              <span>View Site</span>
              <ExternalLink size={12} />
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer"
              title="Logout from admin panel"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Database notice if not connected */}
        {!dbConnected && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start sm:items-center gap-2.5">
              <AlertTriangle size={18} className="shrink-0 text-amber-400 mt-0.5 sm:mt-0" />
              <div>
                <strong className="font-semibold text-amber-100">
                  MongoDB URL pending in environment variables.
                </strong>{' '}
                <span>
                  Currently storing logs in active memory buffer. Add{' '}
                  <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300 font-mono">
                    MONGODB_URI=mongodb+srv://...
                  </code>{' '}
                  in your <code className="bg-slate-900 px-1 py-0.5 rounded font-mono">.env.local</code> to persist logs permanently.
                </span>
              </div>
            </div>
            <div className="shrink-0 font-mono text-[11px] text-amber-300/80">
              Ready for connection
            </div>
          </div>
        )}

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Visits */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase text-slate-400">Total Visits</span>
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Globe size={18} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-['Manrope']">
              {stats?.totalVisits ?? logs.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Recorded portfolio pageviews
            </div>
          </div>

          {/* 2. Unique IP Visitors */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase text-emerald-400 font-semibold">Unique Visitors</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Users size={18} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-300 font-['Manrope']">
              {stats?.uniqueVisitors ?? new Set(logs.map((l) => l.ip)).size}
            </div>
            <div className="text-[11px] text-emerald-400/70 mt-1">
              Distinct IP addresses
            </div>
          </div>

          {/* 3. Today's Visits */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase text-slate-400">Today's Visits</span>
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Calendar size={18} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-['Manrope']">
              {stats?.todayVisits ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Visits recorded since 00:00
            </div>
          </div>

          {/* 4. Top Device & Browser */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase text-slate-400">Top Device</span>
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Laptop size={18} />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-bold text-white truncate font-['Manrope']">
              {stats?.topDevices?.[0]?.type || 'Desktop'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 truncate">
              {stats?.topBrowsers?.[0]?.name ? `${stats.topBrowsers[0].name} (${stats.topBrowsers[0].count} visits)` : 'Tracking...'}
            </div>
          </div>
        </div>

        {/* Quick Breakdowns Banner */}
        {stats && (stats.topBrowsers?.length > 0 || stats.topPaths?.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Top Visited Routes */}
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4">
              <h3 className="text-xs font-mono uppercase text-slate-400 mb-3 flex items-center justify-between">
                <span>Top Visited Routes</span>
                <span className="text-[10px] text-slate-500">Hits</span>
              </h3>
              <div className="space-y-2">
                {stats.topPaths?.slice(0, 4).map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-300 truncate max-w-[180px] bg-slate-950/60 px-1.5 py-0.5 rounded border border-slate-800">
                      {p.path}
                    </span>
                    <span className="font-bold text-slate-400 font-mono">{p.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Browsers */}
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4">
              <h3 className="text-xs font-mono uppercase text-slate-400 mb-3 flex items-center justify-between">
                <span>Browsers</span>
                <span className="text-[10px] text-slate-500">Count</span>
              </h3>
              <div className="space-y-2">
                {stats.topBrowsers?.slice(0, 4).map((b, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">{b.name}</span>
                    <span className="font-bold text-slate-400 font-mono">{b.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Operating Systems */}
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4">
              <h3 className="text-xs font-mono uppercase text-slate-400 mb-3 flex items-center justify-between">
                <span>Operating Systems</span>
                <span className="text-[10px] text-slate-500">Count</span>
              </h3>
              <div className="space-y-2">
                {stats.topOperatingSystems?.slice(0, 4).map((o, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">{o.name}</span>
                    <span className="font-bold text-slate-400 font-mono">{o.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-sm space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Search size={16} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by IP, path, browser, OS, country, referrer..."
                className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {(
                [
                  { id: 'all', label: 'All Visits' },
                  { id: 'unique', label: 'Unique IPs' },
                  { id: 'repeat', label: 'Repeat Visits' },
                  { id: 'today', label: 'Today Only' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    filterType === f.id
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Actions: Export & Clear */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCsv}
                disabled={!logs.length}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
                title="Export visitor logs to CSV"
              >
                <Download size={13} />
                <span className="hidden sm:inline">Export CSV</span>
              </button>

              <button
                onClick={handleClearLogs}
                disabled={!logs.length}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
                title="Clear all logs"
              >
                <Trash2 size={13} />
                <span className="hidden sm:inline">Clear</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>
              Showing {filteredLogs.length} of {logs.length} logged visits
            </span>
            {searchQuery && (
              <span>Filter active: &ldquo;{searchQuery}&rdquo;</span>
            )}
          </div>
        </div>

        {/* Logs Table / Card List */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
          {filteredLogs.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-slate-400 mx-auto flex items-center justify-center mb-3">
                <Users size={24} />
              </div>
              <h3 className="text-base font-semibold text-white mb-1">
                No visitor logs found
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                {logs.length === 0
                  ? 'No visitors have been recorded yet. Browse around the portfolio to generate initial telemetry!'
                  : 'No visitor logs match your search criteria. Try adjusting your filters.'}
              </p>
              <button
                onClick={fetchLogs}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              >
                <RefreshCw size={13} />
                <span>Refresh Logs</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Visitor IP & Status</th>
                    <th className="py-3 px-4">Route Visited</th>
                    <th className="py-3 px-4">Device & OS</th>
                    <th className="py-3 px-4">Browser</th>
                    <th className="py-3 px-4">Screen / Viewport</th>
                    <th className="py-3 px-4">Referrer</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredLogs.map((log, index) => {
                    const isNewIp = log.isUniqueIp;
                    return (
                      <tr
                        key={log.id || log._id || index}
                        className="hover:bg-slate-800/30 transition-colors group"
                      >
                        {/* 1. Timestamp */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-medium text-slate-200">
                            {formatRelativeTime(log.timestamp)}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {new Date(log.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </div>
                        </td>

                        {/* 2. IP & Unique Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-mono text-slate-200 font-medium">
                            {log.ip}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {isNewIp ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <span>★ Unique IP</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                <span>Visit #{log.visitCount || 2}</span>
                              </span>
                            )}
                            {log.location?.country && (
                              <span className="text-[10px] text-slate-400">
                                {log.location.city ? `${log.location.city}, ` : ''}{log.location.country}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 3. Route */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-mono text-[11px] px-2 py-1 rounded bg-slate-950/80 text-emerald-300 border border-slate-800">
                            {log.path || '/'}
                          </span>
                        </td>

                        {/* 4. Device & OS */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {getDeviceIcon(log.device?.type)}
                            <span className="text-slate-200 font-medium">
                              {log.device?.type || 'Desktop'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {log.os?.name || 'Unknown OS'} {log.os?.version || ''}
                          </div>
                        </td>

                        {/* 5. Browser */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="text-slate-200 font-medium">
                            {log.browser?.name || 'Unknown'}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            v{log.browser?.version || '?'}
                          </div>
                        </td>

                        {/* 6. Screen & Viewport */}
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-400">
                          <div>{log.screen?.resolution || 'Unknown'}</div>
                          {log.viewport?.width ? (
                            <div className="text-[10px] text-slate-500">
                              VP: {log.viewport.width}x{log.viewport.height}
                            </div>
                          ) : null}
                        </td>

                        {/* 7. Referrer */}
                        <td className="py-3.5 px-4 max-w-[140px] truncate text-slate-400" title={log.referrer}>
                          {log.referrer === 'Direct' || !log.referrer ? (
                            <span className="text-slate-500 italic">Direct</span>
                          ) : (
                            <span className="text-slate-300 font-mono text-[11px] truncate">
                              {log.referrer.replace(/^https?:\/\//, '')}
                            </span>
                          )}
                        </td>

                        {/* 8. Inspect Details */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:text-white transition-colors cursor-pointer"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Inspect Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Code size={16} />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">
                    Visitor Telemetry Inspector
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400">
                    IP: {selectedLog.ip} • {selectedLog.isUniqueIp ? 'Unique Visitor' : `Visit #${selectedLog.visitCount}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Telemetry Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 font-mono text-[10px] uppercase block mb-1">
                    Timestamp
                  </span>
                  <div className="font-mono text-slate-200">{selectedLog.timestamp}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 font-mono text-[10px] uppercase block mb-1">
                    Path Visited
                  </span>
                  <div className="font-mono text-emerald-400 font-bold">{selectedLog.path}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 font-mono text-[10px] uppercase block mb-1">
                    Browser & Version
                  </span>
                  <div className="text-slate-200">
                    {selectedLog.browser?.name} v{selectedLog.browser?.version || 'N/A'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 font-mono text-[10px] uppercase block mb-1">
                    OS & Device
                  </span>
                  <div className="text-slate-200">
                    {selectedLog.os?.name} {selectedLog.os?.version} ({selectedLog.device?.type})
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 font-mono text-[10px] uppercase block mb-1">
                    Screen & Viewport
                  </span>
                  <div className="font-mono text-slate-200">
                    {selectedLog.screen?.resolution} (VP: {selectedLog.viewport?.width}x{selectedLog.viewport?.height})
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 font-mono text-[10px] uppercase block mb-1">
                    Timezone & Language
                  </span>
                  <div className="text-slate-200">
                    {selectedLog.timezone} ({selectedLog.language})
                  </div>
                </div>
              </div>

              {/* User Agent */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-500 font-mono text-[10px] uppercase block mb-1.5">
                  User Agent String
                </span>
                <div className="font-mono text-[11px] text-slate-300 break-all bg-slate-900 p-2 rounded border border-slate-800">
                  {selectedLog.userAgent}
                </div>
              </div>

              {/* Raw JSON */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 font-mono text-[11px] uppercase">
                    Raw JSON Record
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2));
                      setCopiedJson(true);
                      setTimeout(() => setCopiedJson(false), 2000);
                    }}
                    className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedJson ? (
                      <>
                        <CheckCircle2 size={12} />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <span>Copy JSON</span>
                    )}
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300/90 overflow-x-auto max-h-52">
                  {JSON.stringify(selectedLog, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
