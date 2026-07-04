'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from '@/actions/auth';

const links = [
  { href: '/dashboard', label: 'Resumo', icon: '◫' },
  { href: '/dashboard/agenda', label: 'Agenda', icon: '▤' },
  { href: '/dashboard/servicos', label: 'Serviços', icon: '✂' },
  { href: '/dashboard/financeiro', label: 'Financeiro', icon: '◈' },
  { href: '/dashboard/config', label: 'Config', icon: '⚙' },
];

export function Sidebar({
  tenantName,
  tenantSlug,
}: {
  tenantName: string;
  tenantSlug: string;
}) {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname.startsWith(href);
  }

  return (
    <>
      {/* Sidebar — desktop */}
      <aside className="sticky top-0 hidden h-screen w-60 flex-col border-r border-barber-line bg-charcoal-soft/50 p-5 md:flex">
        <Link
          href="/dashboard"
          className="font-display text-xl font-bold tracking-wide text-brass"
        >
          AGENDABARBA
        </Link>
        <p className="mt-1 truncate text-xs text-cream/50">{tenantName}</p>

        <nav className="mt-8 flex flex-col gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                isActive(link.href)
                  ? 'bg-brass/15 font-medium text-brass-light'
                  : 'text-cream/60 hover:bg-charcoal-soft hover:text-cream'
              }`}
            >
              <span aria-hidden className="w-5 text-center">
                {link.icon}
              </span>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-2">
          <a
            href={`/b/${tenantSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-brass/40 px-3 py-2 text-center text-xs text-brass transition-colors hover:bg-brass/10"
          >
            Ver minha página ↗
          </a>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full rounded-xl px-3 py-2 text-xs text-cream/50 transition-colors hover:text-cream"
            >
              Sair da conta
            </button>
          </form>
        </div>
      </aside>

      {/* Bottom nav — mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-barber-line bg-charcoal-soft/95 backdrop-blur md:hidden">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] ${
              isActive(link.href) ? 'text-brass-light' : 'text-cream/50'
            }`}
          >
            <span aria-hidden className="text-base leading-none">
              {link.icon}
            </span>
            {link.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
