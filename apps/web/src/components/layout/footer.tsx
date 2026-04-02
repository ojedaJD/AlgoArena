import Link from 'next/link';
import { Code2, Zap, Github, Twitter } from 'lucide-react';

// ─────────────────────────────────────────────
// Footer Component
// ─────────────────────────────────────────────

const FOOTER_LINKS = {
  Platform: [
    { label: 'Problems', href: '/problems' },
    { label: 'Compete', href: '/compete' },
    { label: 'Leaderboard', href: '/leaderboard' },
    { label: 'Topics', href: '/topics' },
  ],
  Account: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Profile', href: '/profile' },
    { label: 'Settings', href: '/settings' },
    { label: 'Friends', href: '/friends' },
  ],
  Resources: [
    { label: 'Documentation', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Roadmap', href: '#' },
    { label: 'API', href: '#' },
  ],
};

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-800 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Main footer content */}
        <div className="py-12 grid grid-cols-2 gap-8 md:grid-cols-5">

          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 group w-fit">
              <div className="relative flex items-center justify-center size-9 rounded-xl bg-blue-600 shrink-0">
                <Code2 size={20} className="text-white" />
                <Zap size={10} className="absolute -top-1 -right-1 text-yellow-400 fill-yellow-400" />
              </div>
              <span className="text-lg font-bold gradient-text">AlgoArena</span>
            </Link>
            <p className="mt-4 text-sm text-slate-400 max-w-xs leading-relaxed">
              Master Data Structures &amp; Algorithms through competitive 1v1 battles,
              structured learning, and real-time progress tracking.
            </p>
            {/* Social Links */}
            <div className="mt-5 flex items-center gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="flex items-center justify-center size-8 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all duration-200"
              >
                <Github size={17} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter / X"
                className="flex items-center justify-center size-8 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all duration-200"
              >
                <Twitter size={17} />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-slate-300 mb-3">{category}</h4>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-slate-500 hover:text-slate-300 transition-colors duration-200"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">
            &copy; {year} AlgoArena. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
