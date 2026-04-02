'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Code2, Zap, Swords, ArrowRight, Loader2 } from 'lucide-react';

/**
 * Login page — immediately redirects to Auth0 Universal Login.
 * Shows a brief loading state while the redirect is in progress.
 */
export default function LoginPage() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') ?? '/dashboard';

  useEffect(() => {
    const encoded = encodeURIComponent(returnTo);
    window.location.href = `/api/auth/login?returnTo=${encoded}`;
  }, [returnTo]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative flex items-center justify-center size-16 rounded-2xl bg-blue-600 shadow-glow-blue mb-4">
            <Code2 size={30} className="text-white" />
            <Zap size={14} className="absolute -top-1.5 -right-1.5 text-yellow-400 fill-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">AlgoArena</h1>
          <p className="text-slate-500 text-sm mt-1">Signing you in...</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-8 text-center shadow-2xl">
          <div className="flex items-center justify-center mb-6">
            <Loader2 size={36} className="text-blue-500 animate-spin" />
          </div>

          <h2 className="text-xl font-semibold text-slate-100 mb-2">
            Redirecting to login
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            You&apos;ll be redirected to our secure authentication page. This should only take a moment.
          </p>

          {/* Manual link fallback */}
          <a
            href={`/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`}
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
          >
            Continue manually
            <ArrowRight size={14} />
          </a>
        </div>

        {/* Feature highlights */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Swords size={12} />
            <span>1v1 Battles</span>
          </div>
          <div className="w-px h-3 bg-slate-800" />
          <div className="flex items-center gap-1.5">
            <span>1,000+ Problems</span>
          </div>
          <div className="w-px h-3 bg-slate-800" />
          <div className="flex items-center gap-1.5">
            <span>Free to start</span>
          </div>
        </div>

        <p className="text-center mt-8 text-xs text-slate-700">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="text-blue-500 hover:text-blue-400 transition-colors"
          >
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
