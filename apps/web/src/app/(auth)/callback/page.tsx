'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Code2, Zap, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

type Status = 'loading' | 'success' | 'error';

/**
 * OAuth callback page.
 * Auth0's SDK processes the authorization code server-side via /api/auth/callback.
 * This page provides visual feedback during that brief processing window.
 */
export default function CallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    // Poll /api/auth/me to detect when the session is ready
    let attempts = 0;
    const maxAttempts = 20; // 10 seconds

    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          setStatus('success');
          setTimeout(() => router.replace('/dashboard'), 800);
          return;
        }
      } catch {
        // ignore fetch errors during polling
      }

      attempts++;
      if (attempts >= maxAttempts) {
        setStatus('error');
        return;
      }

      setTimeout(checkSession, 500);
    };

    // Small initial delay to let the server-side callback complete
    setTimeout(checkSession, 300);
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-blue-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm text-center">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative flex items-center justify-center size-16 rounded-2xl bg-blue-600 shadow-glow-blue">
            <Code2 size={30} className="text-white" />
            <Zap size={14} className="absolute -top-1.5 -right-1.5 text-yellow-400 fill-yellow-400" />
          </div>
        </div>

        {/* Status indicator */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-8 shadow-2xl">
          {status === 'loading' && (
            <>
              <Loader2 size={40} className="text-blue-500 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-100 mb-2">
                Signing you in...
              </h2>
              <p className="text-slate-400 text-sm">
                Verifying your credentials and setting up your session.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="size-12 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={26} className="text-emerald-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-100 mb-2">
                Welcome back!
              </h2>
              <p className="text-slate-400 text-sm">
                Redirecting you to your dashboard...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="size-12 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={26} className="text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-100 mb-2">
                Authentication failed
              </h2>
              <p className="text-slate-400 text-sm mb-5">
                Something went wrong during sign-in. Please try again.
              </p>
              <a
                href="/login"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
              >
                Back to login
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
