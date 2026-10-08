
import { X, Server } from 'lucide-react';
import { ServerItem } from '../store/serversSlice.js';
import { StatusBadge } from './StatusBadge.js';

interface ServerDrawerProps {
  server: ServerItem | null;
  onClose: () => void;
}

export function ServerDrawer({ server, onClose }: ServerDrawerProps) {
  if (!server) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-slate-900 border-l border-slate-800 shadow-2xl p-6 z-50 flex flex-col justify-between">
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-semibold text-white">Server Details</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs font-mono">
          <div>
            <div className="text-slate-500 text-[11px] mb-1">HOSTNAME</div>
            <div className="text-slate-100 font-medium text-sm">{server.hostname}</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-slate-500 text-[11px] mb-1">ENVIRONMENT</div>
              <div className="text-blue-400 font-semibold">{server.environment}</div>
            </div>
            <div>
              <div className="text-slate-500 text-[11px] mb-1">STATUS</div>
              <StatusBadge status={server.status} />
            </div>
          </div>

          <div>
            <div className="text-slate-500 text-[11px] mb-1">OWNER TEAM</div>
            <div className="text-slate-200">{server.ownerTeam}</div>
          </div>

          <div>
            <div className="text-slate-500 text-[11px] mb-1">OPERATING SYSTEM</div>
            <div className="text-slate-300">{server.os}</div>
          </div>

          <div>
            <div className="text-slate-500 text-[11px] mb-1">SERVER UUID</div>
            <div className="text-slate-400 break-all select-all">{server.id}</div>
          </div>

          <div>
            <div className="text-slate-500 text-[11px] mb-1">CREATED AT</div>
            <div className="text-slate-400">{new Date(server.createdAt).toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800">
        <button
          onClick={onClose}
          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded text-slate-200 transition-colors"
        >
          Close Drawer
        </button>
      </div>
    </div>
  );
}