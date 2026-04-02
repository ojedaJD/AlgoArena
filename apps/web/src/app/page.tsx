import Link from 'next/link';
import {
  ArrowRight,
  Zap,
  BookOpen,
  Swords,
  BarChart3,
  GraduationCap,
  Trophy,
  Star,
  CheckCircle2,
  Users,
  Code2,
  Timer,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Footer } from '@/components/layout/footer';

// ─────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────

const FEATURES = [
  {
    icon: BookOpen,
    color: 'blue',
    title: 'Practice Problems',
    description:
      'Work through 1,000+ carefully curated DSA problems spanning arrays, graphs, DP, trees, and more — each with hints and editorial solutions.',
    tags: ['Easy to Hard', 'Editorials', 'Test Cases'],
  },
  {
    icon: Swords,
    color: 'purple',
    title: 'Live 1v1 Battles',
    description:
      'Challenge friends or match with opponents of your skill level. Race to solve problems first in real-time — spectators welcome.',
    tags: ['Real-time', 'ELO Rating', 'Spectate'],
  },
  {
    icon: BarChart3,
    color: 'emerald',
    title: 'Track Progress',
    description:
      'Visualize your growth with detailed analytics — streak counts, XP curves, per-topic accuracy, and submission history.',
    tags: ['Streaks', 'XP System', 'Analytics'],
  },
  {
    icon: GraduationCap,
    color: 'orange',
    title: 'Structured Learning',
    description:
      'Follow curated topic roadmaps from Beginner to Advanced, with prerequisite tracking and spaced repetition reminders.',
    tags: ['Roadmaps', 'Spaced Rep', 'Beginner Friendly'],
  },
];

const STATS = [
  { value: '1,000+', label: 'Problems', icon: BookOpen },
  { value: 'Real-time', label: '1v1 Matches', icon: Swords },
  { value: 'Adaptive', label: 'Learning Engine', icon: TrendingUp },
  { value: '6', label: 'Languages', icon: Code2 },
];

const LANGUAGE_BADGES = ['Python', 'C++', 'Java', 'JavaScript', 'TypeScript', 'Go'];

const COLOR_MAP: Record<string, string> = {
  blue: 'from-blue-600 to-blue-500 shadow-glow-blue',
  purple: 'from-purple-600 to-purple-500',
  emerald: 'from-emerald-600 to-emerald-500 shadow-glow-emerald',
  orange: 'from-orange-500 to-amber-500',
};

const ICON_BG_MAP: Record<string, string> = {
  blue: 'bg-blue-500/15 text-blue-400',
  purple: 'bg-purple-500/15 text-purple-400',
  emerald: 'bg-emerald-500/15 text-emerald-400',
  orange: 'bg-orange-500/15 text-orange-400',
};

const TAG_MAP: Record<string, string> = {
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

// ─────────────────────────────────────────────
// Landing Page
// ─────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="flex flex-col overflow-hidden">

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <section className="relative isolate overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-slate-950" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
          <div className="absolute top-20 left-1/4 w-[400px] h-[400px] bg-purple-600/8 rounded-full blur-[100px]" />
          <div className="absolute top-40 right-1/4 w-[350px] h-[350px] bg-emerald-600/8 rounded-full blur-[100px]" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(148,163,184,1) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,1) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 sm:pt-32 sm:pb-28">
          <div className="text-center max-w-4xl mx-auto">

            {/* Announcement badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-medium mb-8 animate-fade-in">
              <Zap size={14} className="text-yellow-400 fill-yellow-400" />
              Live 1v1 battles now available
              <ChevronRight size={14} />
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.08] tracking-tight mb-6 animate-slide-up">
              <span className="text-slate-50">Master </span>
              <span
                className="bg-gradient-to-br from-blue-400 via-blue-300 to-cyan-400 bg-clip-text text-transparent"
                style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
              >
                DSA
              </span>
              <br />
              <span className="text-slate-50">Through </span>
              <span
                className="bg-gradient-to-br from-emerald-400 to-teal-400 bg-clip-text text-transparent"
                style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
              >
                Competition
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up">
              Practice 1,000+ curated algorithms problems, battle opponents in real-time
              coding matches, and track your progress with an adaptive learning system.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14 animate-slide-up">
              <Link
                href="/dashboard"
                className={cn(
                  'group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl',
                  'bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base',
                  'shadow-glow-blue hover:shadow-[0_0_30px_rgba(59,130,246,0.6)]',
                  'transition-all duration-300 active:scale-95'
                )}
              >
                Get Started Free
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
              <Link
                href="/problems"
                className={cn(
                  'inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl',
                  'border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-slate-100',
                  'bg-slate-800/50 hover:bg-slate-800 font-semibold text-base',
                  'transition-all duration-300 active:scale-95'
                )}
              >
                View Problems
              </Link>
            </div>

            {/* Language support badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
              {LANGUAGE_BADGES.map((lang) => (
                <span
                  key={lang}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono text-slate-400"
                >
                  <Code2 size={11} className="text-blue-500" />
                  {lang}
                </span>
              ))}
            </div>
            <p className="text-xs text-slate-600">6 languages supported</p>
          </div>

          {/* Hero code preview */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-2xl shadow-slate-950/50 overflow-hidden">
              {/* Window chrome */}
              <div className="flex items-center justify-between px-5 py-3 bg-slate-800/60 border-b border-slate-700/60">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full bg-red-500/70" />
                  <span className="size-3 rounded-full bg-yellow-500/70" />
                  <span className="size-3 rounded-full bg-emerald-500/70" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-500">two_sum.py</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 size={10} />
                    Accepted
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Timer size={12} />
                  <span>42ms</span>
                </div>
              </div>

              {/* Code */}
              <div className="p-6 font-mono text-sm leading-relaxed">
                <div className="space-y-1">
                  <CodeLine indent={0} comment>
                    # Two Sum — O(n) time, O(n) space
                  </CodeLine>
                  <CodeLine indent={0} keyword="def" func="twoSum" params="nums: List[int], target: int) -> List[int]:" />
                  <CodeLine indent={1} text="seen " op="=" text2=" {}" />
                  <CodeLine indent={1} keyword="for" text=" i, n " keyword2="in" text2=" enumerate(nums):" />
                  <CodeLine indent={2} text="complement " op="=" text2=" target " op2="-" text3=" n" />
                  <CodeLine indent={2} keyword="if" text=" complement " keyword2="in" text2=" seen:" />
                  <CodeLine indent={3} keyword="return" text=" [seen[complement], i]" />
                  <CodeLine indent={2} text="seen[n] " op="=" text2=" i" />
                  <CodeLine indent={1} keyword="return" text=" []" />
                </div>

                {/* Output */}
                <div className="mt-5 pt-4 border-t border-slate-800">
                  <p className="text-[10px] font-sans text-slate-600 uppercase tracking-wider mb-2">Output</p>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 size={13} />
                      All 57 test cases passed
                    </span>
                    <span className="text-slate-500">Runtime: 42ms (beats 94%)</span>
                    <span className="text-slate-500">Memory: 17.2MB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          STATS SECTION
      ══════════════════════════════════════ */}
      <section className="border-y border-slate-800 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center gap-2 text-center">
                <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-1">
                  <Icon size={20} />
                </div>
                <span className="text-2xl font-black text-slate-100">{value}</span>
                <span className="text-sm text-slate-500">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURES GRID
      ══════════════════════════════════════ */}
      <section className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-blue-400 uppercase tracking-widest mb-3">
              Everything you need
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-100 mb-4">
              Built for serious learners
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              A complete platform to go from beginner to cracking top tech interviews.
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map(({ icon: Icon, color, title, description, tags }) => (
              <div
                key={title}
                className={cn(
                  'group relative rounded-2xl border border-slate-800 bg-slate-900/50 p-8',
                  'hover:border-slate-600 hover:-translate-y-1',
                  'transition-all duration-300'
                )}
              >
                {/* Background glow on hover */}
                <div
                  className={cn(
                    'absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                    color === 'blue' && 'bg-gradient-to-br from-blue-600/5 to-transparent',
                    color === 'purple' && 'bg-gradient-to-br from-purple-600/5 to-transparent',
                    color === 'emerald' && 'bg-gradient-to-br from-emerald-600/5 to-transparent',
                    color === 'orange' && 'bg-gradient-to-br from-orange-600/5 to-transparent',
                  )}
                />

                {/* Icon */}
                <div
                  className={cn(
                    'relative inline-flex items-center justify-center size-14 rounded-2xl mb-5',
                    `bg-gradient-to-br ${COLOR_MAP[color]}`,
                  )}
                >
                  <Icon size={26} className="text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-slate-100 mb-3">{title}</h3>
                <p className="text-slate-400 leading-relaxed mb-5 text-[15px]">{description}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className={cn(
                        'text-xs font-medium px-2.5 py-1 rounded-full border',
                        TAG_MAP[color]
                      )}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          COMPETE CTA SECTION
      ══════════════════════════════════════ */}
      <section className="py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto rounded-3xl border border-blue-500/20 bg-slate-900/60 backdrop-blur-sm p-8 sm:p-12 text-center">

            <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-glow-blue mb-6">
              <Swords size={30} className="text-white" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-slate-100 mb-4">
              Ready to test your skills?
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto mb-8 leading-relaxed">
              Join live 1v1 coding battles, climb the leaderboard, and prove you&apos;re
              the fastest solver in the arena.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/compete"
                className={cn(
                  'group inline-flex items-center gap-2.5 px-8 py-4 rounded-xl',
                  'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400',
                  'text-white font-bold text-base shadow-glow-blue',
                  'transition-all duration-300 active:scale-95'
                )}
              >
                <Swords size={18} />
                Enter the Arena
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
              <Link
                href="/leaderboard"
                className={cn(
                  'inline-flex items-center gap-2.5 px-8 py-4 rounded-xl',
                  'border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-slate-100',
                  'bg-slate-800/50 hover:bg-slate-800 font-semibold text-base',
                  'transition-all duration-300 active:scale-95'
                )}
              >
                <Trophy size={18} />
                View Leaderboard
              </Link>
            </div>

            {/* Social proof */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 pt-6 border-t border-slate-800">
              <SocialProofItem icon={Users} text="Join thousands of developers" />
              <SocialProofItem icon={Star} text="4.9/5 average rating" />
              <SocialProofItem icon={Zap} text="Matches start in under 30s" />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <Footer />
    </div>
  );
}

// ─────────────────────────────────────────────
// Code Line Helper (for hero preview)
// ─────────────────────────────────────────────

function CodeLine({
  indent = 0,
  comment,
  keyword,
  keyword2,
  func,
  params,
  text,
  text2,
  text3,
  op,
  op2,
}: {
  indent?: number;
  comment?: boolean;
  keyword?: string;
  keyword2?: string;
  func?: string;
  params?: string;
  text?: string;
  text2?: string;
  text3?: string;
  op?: string;
  op2?: string;
}) {
  return (
    <div className="flex">
      <span className="w-8 shrink-0 text-right pr-4 text-slate-700 select-none text-xs leading-6">
        {/* line numbers are decorative */}
      </span>
      <span className="leading-6">
        {/* Indentation */}
        {'  '.repeat(indent)}
        {comment && <span className="text-slate-600">{text ?? ''}</span>}
        {!comment && (
          <>
            {keyword && <span className="text-blue-400">{keyword} </span>}
            {func && <span className="text-purple-400">{func}</span>}
            {params && <span className="text-slate-300">({params}</span>}
            {text && !func && <span className="text-slate-300">{text}</span>}
            {op && <span className="text-slate-500">{op}</span>}
            {text2 && <span className="text-slate-300">{text2}</span>}
            {op2 && <span className="text-slate-500"> {op2} </span>}
            {text3 && <span className="text-slate-300">{text3}</span>}
            {keyword2 && <span className="text-blue-400"> {keyword2}</span>}
          </>
        )}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// Social Proof Item
// ─────────────────────────────────────────────

function SocialProofItem({
  icon: Icon,
  text,
}: {
  icon: React.ElementType;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-500">
      <Icon size={15} className="text-slate-600 shrink-0" />
      {text}
    </div>
  );
}

import type React from 'react';
