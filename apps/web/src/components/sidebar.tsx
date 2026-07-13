'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, GitBranch, Search, Settings } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';

const links = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/repositories', label: 'Repositories', icon: GitBranch },
  { href: '/dashboard/search', label: 'Search', icon: Search },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-slate-800 bg-slate-950/90 p-4 text-slate-200">
      <div className="mb-8 text-lg font-semibold">AI Docs</div>
      <nav className="flex flex-1 flex-col gap-2">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href || pathname.startsWith(link.href + '/');

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                active ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4">
        <UserButton afterSignOutUrl="/" />
      </div>
    </aside>
  );
}
