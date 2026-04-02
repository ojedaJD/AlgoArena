'use client';

import { useEffect } from 'react';
import { Code2, Zap, Loader2 } from 'lucide-react';

/**
 * Logout page — immediately redirects to Auth0 logout endpoint,
 * which clears the session and redirects to the home page.
 */
export default function LogoutPage() {
  useEffect(() => {
    window.location.href = '/api/auth/logout?returnTo=/';
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-slate-800/30 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 text-center">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative flex items-center justify-center size-16 rounded-2xl bg-blue-600 shadow-glow-blue">
            <Code2 size={30} className="text-white" />
            <Zap size={14} className="absolute -top-1.5 -right-1.5 text-yellow-400 fill-yellow-400" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm px-10 py-8 shadow-2xl max-w-sm w-full mx-auto">
          <Loader2 size={36} className="text-slate-500 animate-spin mx-auto mb-5" />
          <h2 className="text-lg font-semibold text-slate-300 mb-1">Signing out...</h2>
          <p className="text-sm text-slate-500">See you next time!</p>
        </div>
      </div>
    </div>
  );
}
