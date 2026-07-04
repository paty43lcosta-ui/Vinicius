import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const features = [
  {
    title: 'Sinal pago na hora',
    description:
      'O cliente paga 30% do serviço via PIX ou cartão no momento da reserva. Chega de furo de agenda.',
  },
  {
    title: 'Sua página de agendamento',
    description:
      'Cada barbearia tem seu link próprio. O cliente escolhe serviço, dia e horário em menos de 2 minutos, direto do celular.',
  },
  {
    title: 'Painel completo',
    description:
      'Agenda da semana, serviços, financeiro e configurações em um painel feito para o dia a dia da barbearia.',
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="font-display text-2xl font-bold tracking-wide text-brass">
          AGENDABARBA
        </span>
        <nav className="flex items-center gap-3">
          <Link
            href="/entrar"
            className="text-sm text-cream/70 transition-colors hover:text-cream"
          >
            Entrar
          </Link>
          <Link href="/cadastro">
            <Button size="sm">Criar conta</Button>
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-5xl px-6 pb-20 pt-16 text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-brass">
          Para barbearias de bairro
        </p>
        <h1 className="mx-auto max-w-3xl font-display text-5xl font-extrabold uppercase leading-tight tracking-wide sm:text-6xl">
          Agenda cheia,
          <br />
          <span className="text-brass">sem furo.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-cream/70">
          Agendamento online com cobrança de sinal na reserva. O cliente que
          marca, aparece — e você para de perder dinheiro com horário vago.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/cadastro">
            <Button size="lg">Começar agora</Button>
          </Link>
          <Link href="/entrar">
            <Button size="lg" variant="secondary">
              Já tenho conta
            </Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-6 pb-24 sm:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title}>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-brass-light">
              {feature.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-cream/70">
              {feature.description}
            </p>
          </Card>
        ))}
      </section>

      <footer className="border-t border-barber-line py-8 text-center text-xs text-cream/40">
        AgendaBarba — agendamento com sinal para barbearias.
      </footer>
    </main>
  );
}
