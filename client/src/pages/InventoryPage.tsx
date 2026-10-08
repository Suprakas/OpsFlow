import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/index.js';
import {
  fetchServers,
  setSearch,
  setEnvironment,
  setPage,
  setSelectedServer,
} from '../store/serversSlice.js';
import { Server, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge.js';
import { ServerDrawer } from '../components/ServerDrawer.js';

export function InventoryPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, pagination, search, environment, isLoading, selectedServer } = useSelector(
    (state: RootState) => state.servers
  );

  const [searchInput, setSearchInput] = useState(search);

  // 300ms search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(setSearch(searchInput));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, dispatch]);

  useEffect(() => {
    dispatch(fetchServers());
  }, [dispatch, search, environment, pagination.page]);

  const envs = ['', 'PROD', 'STAGING', 'QA', 'DR'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-400" /> Server Inventory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse and inspect active infrastructure hosts across environments ({pagination.total} servers total).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search hostname (e.g. app-prod)..."
              className="pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-64"
            />
          </div>
        </div>
      </div>

      {/* Environment Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800 pb-2">
        <Filter className="w-3.5 h-3.5 text-slate-500 mr-2" />
        {envs.map((env) => (
          <button
            key={env}
            onClick={() => dispatch(setEnvironment(env))}
            className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors ${
              environment === env
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {env === '' ? 'ALL ENVIRONMENTS' : env}
          </button>
        ))}
      </div>

      {/* High-Density Data Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] bg-slate-950/40">
                <th className="py-2.5 px-4">HOSTNAME</th>
                <th className="py-2.5 px-4">ENVIRONMENT</th>
                <th className="py-2.5 px-4">STATUS</th>
                <th className="py-2.5 px-4">OWNER TEAM</th>
                <th className="py-2.5 px-4">OPERATING SYSTEM</th>
                <th className="py-2.5 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading servers...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No servers match the selected criteria.
                  </td>
                </tr>
              ) : (
                items.map((srv) => (
                  <tr
                    key={srv.id}
                    onClick={() => dispatch(setSelectedServer(srv))}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-4 text-slate-200 font-semibold">{srv.hostname}</td>
                    <td className="py-2.5 px-4 text-blue-400">{srv.environment}</td>
                    <td className="py-2.5 px-4">
                      <StatusBadge status={srv.status} />
                    </td>
                    <td className="py-2.5 px-4 text-slate-300">{srv.ownerTeam}</td>
                    <td className="py-2.5 px-4 text-slate-400">{srv.os}</td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="text-blue-400 hover:underline">View Details</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <div>
            Showing Page <span className="text-white">{pagination.page}</span> of{' '}
            <span className="text-white">{pagination.totalPages || 1}</span> ({pagination.total} total)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => dispatch(setPage(pagination.page - 1))}
              disabled={pagination.page <= 1}
              className="p-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => dispatch(setPage(pagination.page + 1))}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <ServerDrawer server={selectedServer} onClose={() => dispatch(setSelectedServer(null))} />
    </div>
  );
}