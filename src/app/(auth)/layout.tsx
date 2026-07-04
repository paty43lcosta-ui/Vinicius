import Link from 'next/link';

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <Link
        href="/"
        className="mb-8 font-display text-2xl font-bold tracking-wide text-brass"
      >
        AGENDABARBA
      </Link>
      <div className="w-full max-w-md rounded-2xl border border-barber-line bg-charcoal-soft p-8">
        {children}
      </div>
    </main>
  );
}
