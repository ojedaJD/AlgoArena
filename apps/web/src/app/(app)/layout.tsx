import type React from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { SocketProvider } from '@/providers/socket-provider';

/**
 * Authenticated app layout.
 *
 * - In production with Auth0 configured, performs a server-side session check.
 * - Renders the collapsible sidebar + scrollable main content area.
 * - Wraps children in SocketProvider.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth guard — only enforce when Auth0 is configured
  let isAuthed = false;

  if (process.env.AUTH0_SECRET) {
    try {
      const { getSession } = await import('@auth0/nextjs-auth0');
      const session = await getSession();
      isAuthed = !!session?.user;
    } catch {
      isAuthed = false;
    }

    if (!isAuthed) {
      const { redirect } = await import('next/navigation');
      redirect('/login?returnTo=/dashboard');
    }
  } else {
    // Dev mode — no Auth0, treat as authenticated
    isAuthed = true;
  }

  return (
    <SocketProvider enabled={isAuthed}>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* Sidebar — hidden on mobile, shown md+ */}
        <div className="hidden md:flex shrink-0">
          <Sidebar />
        </div>

        {/* Main scrollable content */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto bg-slate-950 focus:outline-none"
          tabIndex={-1}
        >
          <div className="min-h-full">
            {children}
          </div>
        </main>
      </div>
    </SocketProvider>
  );
}
