'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Code2, Zap, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

const PERKS = [
  'Free forever — no credit card required',
  'Instant access to 1,000+ problems',
  'Join live 1v1 coding battles',
  'Track your progress and earn XP',
];

/**
 * Sign-up page — redirects to Auth0 with screen_hint=signup
 * so users land directly on the registration form.
 */
export default function SignupPage() {
  useEffect(() => {
    window.location.href = '/api/auth/login?screen_hint=signup&returnTo=/dashboard';
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-emerald-600/8 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-blue-600/8 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative flex items-center justify-center size-16 rounded-2xl bg-blue-600 shadow-glow-blue mb-4">
            <Code2 size={30} className="text-white" />
            <Zap size={14} className="absolute -top-1.5 -right-1.5 text-yellow-400 fill-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Join AlgoArena</h1>
          <p className="text-slate-500 text-sm mt-1">Create your free account</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-8 shadow-2xl">
          {/* Loading indicator */}
          <div className="flex items-center justify-center mb-6">
            <Loader2 size={36} className="text-emerald-500 animate-spin" />
          </div>

          <h2 className="text-xl font-semibold text-slate-100 mb-2 text-center">
            Setting up your account
          </h2>
          <p className="text-slate-400 text-sm text-center mb-6 leading-relaxed">
            Redirecting to our secure sign-up page...
          </p>

          {/* Perks */}
          <ul className="space-y-2.5 mb-6">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-center gap-2.5 text-sm text-slate-400">
                <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                {perk}
              </li>
            ))}
          </ul>

          {/* Manual link fallback */}
          <div className="text-center">
            <a
              href="/api/auth/login?screen_hint=signup&returnTo=/dashboard"
              className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
            >
              Continue manually
              <ArrowRight size={14} />
            </a>
          </div>
        </div>

        <p className="text-center mt-6 text-xs text-slate-700">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-blue-500 hover:text-blue-400 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
