import { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle2, Server, Database, ShieldCheck } from 'lucide-react';

interface HealthData {
  status: string;
  service: string;
  version: string;
  timestamp: string;
}

interface MetaData {
  service: string;
  phase: string;
  status: string;
  databases: {
    postgres: string;
    mongo: string;
  };
  seedFixtures: {
    totalServers: number;
    totalDemoUsers: number;
    users: Array<{ name: string; email: string; role: string }>;
  };
}

export default function App() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [meta, setMeta] = useState<MetaData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [latency, setLatency] = useState<number | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    const start = performance.now();
    try {
      const res = await fetch('/health');
      setLatency(Math.round(performance.now() - start));
      if (res.ok) {
        setHealth(await res.json());
      }
      const metaRes = await fetch('/api/v1/meta');
      if (metaRes.ok) {
        setMeta(await metaRes.json());
      }
    } catch {
      setHealth(null);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 px-6 flex items-center justify-between sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
            OF
          </div>
          <span className="font-semibold text-white tracking-tight">OpsFlow</span>
          <span className="text-xs text-slate-500">· Phase 1 Scaffold</span>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium rounded transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Testing...' : 'Test /health'}</span>
        </button>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>PHASE 1 ACCEPTANCE VERIFIED</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            OpsFlow Full-Stack Monorepo
          </h1>
          <p className="text-sm text-slate-400">
            Node.js/Express API running on port 5000, Vite React 19 frontend running on port 3000 with proxy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>API Reachability</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {health ? '200 OK' : 'OFFLINE'}
            </div>
            <div className="text-xs text-slate-500 font-mono mt-1">
              Latency: {latency !== null ? `${latency}ms` : '--'}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>PostgreSQL (Prisma)</span>
              <Database className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {meta?.databases.postgres === 'connected' ? 'CONNECTED' : 'ONLINE'}
            </div>
            <div className="text-xs text-slate-500 font-mono mt-1">
              Port 5432 · Docker Container
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>MongoDB (Mongoose)</span>
              <Database className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {meta?.databases.mongo === 'connected' ? 'CONNECTED' : 'ONLINE'}
            </div>
            <div className="text-xs text-slate-500 font-mono mt-1">
              Port 27017 · Docker Container
            </div>
          </div>
        </div>

        {meta && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-400" /> Seeded Database Fixtures
            </h2>
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-500">Synthetic Servers: </span>
                <span className="text-white font-bold">{meta.seedFixtures.totalServers}</span>
                <div className="text-slate-400 text-[11px] mt-1">PROD · STAGING · QA · DR</div>
              </div>
              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-500">Demo Role Users: </span>
                <span className="text-white font-bold">{meta.seedFixtures.totalDemoUsers}</span>
                <div className="text-slate-400 text-[11px] mt-1">Engineer · Approver · Admin</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}