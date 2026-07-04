import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="font-display text-7xl font-extrabold text-brass">404</p>
      <h1 className="font-display text-2xl font-bold uppercase tracking-wide">
        Página não encontrada
      </h1>
      <p className="max-w-sm text-sm text-cream/60">
        O endereço que você acessou não existe ou a barbearia não está mais
        disponível.
      </p>
      <Link href="/">
        <Button variant="secondary">Voltar para o início</Button>
      </Link>
    </main>
  );
}
