# AgendaBarba

SaaS multi-tenant de agendamento online para barbearias de bairro, com **cobrança de sinal (depósito) na reserva** via PIX ou cartão (Mercado Pago). O sinal é 30% do valor do serviço (mínimo R$ 10, configurável de 20% a 50%); o restante é pago presencialmente.

## Stack

- **Next.js 14** (App Router, Server Actions, TypeScript strict)
- **Tailwind CSS v3** com tokens do design (charcoal `#1B1B1D`, creme `#F2ECE2`, latão `#C08A35`)
- **Supabase** — Postgres + Auth + Realtime, multi-tenant com Row Level Security
- **Mercado Pago** — PIX nativo (QR Code) e cartão via Checkout Pro
- **Resend** — e-mail de confirmação
- **Zod + React Hook Form** — validação compartilhada servidor/cliente
- **@dnd-kit** — reordenação de serviços por drag-and-drop

## Rotas

| Rota | Descrição |
|---|---|
| `/` | Landing page da plataforma |
| `/entrar` · `/cadastro` | Login e cadastro do dono |
| `/dashboard` | Resumo (agendamentos hoje, sinais no mês, conversão) |
| `/dashboard/agenda` | Agenda semanal com Realtime, concluir/cancelar |
| `/dashboard/servicos` | Serviços com drag-and-drop, edição inline, toggle |
| `/dashboard/financeiro` | Tabela com filtros de período + export CSV |
| `/dashboard/config` | Nome, slug, horários, % do sinal, token do MP |
| `/b/[slug]` | Página pública de agendamento (6 passos) |
| `/b/[slug]/sucesso` | Confirmação pós-pagamento (retorno do cartão) |
| `/api/webhooks/mp` | Webhook do Mercado Pago (assinatura validada) |
| `/api/availability` | Slots ocupados (polling de 30s na página pública) |
| `/api/bookings/[id]/status` | Polling do status durante o pagamento |
| `/api/cron/expire-bookings` | Expira reservas pendentes > 10 min (Vercel Cron) |

## Setup

### 1. Dependências

```bash
npm install
```

### 2. Supabase

Crie um projeto em [supabase.com](https://supabase.com) e rode as migrations **em ordem** (SQL Editor ou `supabase db push` com o CLI):

```
supabase/migrations/0001_tenants.sql
supabase/migrations/0002_services.sql
supabase/migrations/0003_bookings.sql
supabase/migrations/0004_financial_summary.sql
```

> O cadastro cria o usuário já confirmado via service role, então não é
> necessário desligar a confirmação de e-mail no Supabase Auth.

### 3. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — em *Project Settings → API*
- `SUPABASE_SERVICE_ROLE_KEY` — idem (**nunca** exponha no cliente)
- `MP_ACCESS_TOKEN` — credencial da plataforma no [painel de devs do MP](https://www.mercadopago.com.br/developers)
- `MP_WEBHOOK_SECRET` — assinatura secreta configurada em *Suas integrações → Webhooks*
- `RESEND_API_KEY` — opcional em dev; sem ela o e-mail é pulado
- `NEXT_PUBLIC_APP_URL` — URL pública (necessária para webhook e back_urls do MP)
- `CRON_SECRET` — protege a rota de expiração (a Vercel envia `Authorization: Bearer <CRON_SECRET>`)

### 4. Rodar

```bash
npm run dev
```

Para testar o webhook do MP em dev, exponha a porta com um túnel (ex.: `ngrok http 3000`) e aponte `NEXT_PUBLIC_APP_URL` para a URL do túnel.

## Regras de negócio

1. **Conflito de horário** — índice único parcial em `(tenant_id, date, time_slot)` para status ≠ `cancelado`; o erro `23505` vira mensagem amigável.
2. **Reserva temporária** — o slot fica reservado por 10 minutos em `aguardando_pagamento`. A expiração acontece em três camadas: o cron (`vercel.json`, a cada 10 min), a checagem de disponibilidade (pendentes velhos não bloqueiam slots) e a limpeza just-in-time antes de inserir um booking no mesmo slot.
3. **Valores sempre em centavos** no banco; formatação só na exibição.
4. **RLS é a linha de defesa principal** — o service role só é usado no servidor (webhook, disponibilidade pública e criação de booking + pagamento).
5. **Pagamentos** — PIX é criado direto na API de Payments (QR + copia-e-cola na página); cartão usa preferência do Checkout Pro com `back_urls` para `/b/[slug]/sucesso`. Ambos confirmam via webhook `payment.updated` → status `confirmado`.

## Deploy (Vercel)

1. Importe o repositório na Vercel e configure as variáveis de ambiente acima.
2. O `vercel.json` já agenda o cron de expiração a cada 10 minutos.
3. Configure o webhook do MP apontando para `https://SEU-DOMINIO/api/webhooks/mp` (evento *Pagamentos*).
