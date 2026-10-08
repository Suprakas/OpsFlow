import { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { AlertCircle } from 'lucide-react';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch {
      setError('Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const setPersona = (pEmail: string) => {
    setEmail(pEmail);
    setPassword('Password123!');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-lg p-8 space-y-6 shadow-xl">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded bg-blue-600 flex items-center justify-center font-bold text-white text-lg mx-auto shadow-sm">
            OF
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">OpsFlow Portal</h1>
          <p className="text-xs text-slate-400">Enterprise Operations & Change Management</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-mono text-slate-400">EMAIL ADDRESS</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@opsflow.internal"
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-slate-400">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded transition-colors shadow-sm"
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="border-t border-slate-800 pt-4 space-y-2">
          <div className="text-[11px] font-mono text-slate-500 text-center">QUICK DEMO PERSONAS</div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPersona('alex.engineer@opsflow.internal')}
              className="p-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded text-[11px] text-left transition-colors"
            >
              <div className="font-semibold text-slate-200">Alex</div>
              <div className="text-blue-400 font-mono text-[10px]">ENGINEER</div>
            </button>
            <button
              type="button"
              onClick={() => setPersona('sam.approver@opsflow.internal')}
              className="p-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded text-[11px] text-left transition-colors"
            >
              <div className="font-semibold text-slate-200">Sam</div>
              <div className="text-emerald-400 font-mono text-[10px]">APPROVER</div>
            </button>
            <button
              type="button"
              onClick={() => setPersona('jordan.admin@opsflow.internal')}
              className="p-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded text-[11px] text-left transition-colors"
            >
              <div className="font-semibold text-slate-200">Jordan</div>
              <div className="text-purple-400 font-mono text-[10px]">ADMIN</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}