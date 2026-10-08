import { Provider } from 'react-redux';
import { store } from './store/index.js';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { LoginPage } from './pages/LoginPage.js';
import { InventoryPage } from './pages/InventoryPage.js';
import { LogOut, User } from 'lucide-react';

function AppShell() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs font-mono">
        Authenticating session...
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
            OF
          </div>
          <span className="font-semibold text-white tracking-tight">OpsFlow</span>
          <span className="text-xs text-slate-500 hidden sm:inline">· Change Management Portal</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-mono">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-200">{user.name}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                user.role === 'ADMIN'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : user.role === 'APPROVER'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}
            >
              {user.role}
            </span>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-2.5 py-1 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium rounded transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8">
        <InventoryPage />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </Provider>
  );
}