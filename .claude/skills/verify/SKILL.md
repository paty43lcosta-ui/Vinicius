---
name: verify
description: Build, launch and smoke-test the AgendaBarba Next.js app without external credentials.
---

# Verificação do AgendaBarba

## Build e launch

```bash
npm install
npm run build          # typecheck incluído (tsc via next build)
# env dummy: Supabase apontando para porta fechada dá ECONNREFUSED instantâneo
cat > .env.local <<'EOF'
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy-anon-key
SUPABASE_SERVICE_ROLE_KEY=dummy-service-key
MP_ACCESS_TOKEN=TEST-dummy-token
MP_WEBHOOK_SECRET=test-webhook-secret
NEXT_PUBLIC_APP_URL=http://localhost:3100
CRON_SECRET=test-cron-secret
EOF
PORT=3100 npm start &
```

Use `curl --noproxy 127.0.0.1` (o ambiente tem HTTPS_PROXY global).

## Fluxos que funcionam sem Supabase/MP reais

- `GET /` → 200, landing com identidade (charcoal/creme/latão)
- `GET /dashboard` sem sessão → 307 para `/entrar?proximo=%2Fdashboard`
- `GET /entrar`, `/cadastro` → 200 (forms client-side)
- `GET /b/qualquer-slug` → 404 (banco fora = tenant não encontrado)
- `GET /api/availability?tenant_id=abc&date=hoje` → 400; com params válidos → 500 (banco fora)
- `GET /api/bookings/nao-uuid/status` → 400
- `GET /api/cron/expire-bookings` sem `Authorization: Bearer $CRON_SECRET` → 401
- Webhook `/api/webhooks/mp`: body inválido → 400; sem/má assinatura → 401;
  assinatura HMAC válida → passa o gate (500 depois, MP inacessível).
  Manifesto: `id:{data.id};request-id:{x-request-id};ts:{ts};` com o
  `MP_WEBHOOK_SECRET` (sha256 hex em `x-signature: ts=...,v1=...`).

## Screenshots

`playwright-core` + Chromium do ambiente:

```js
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
```

Instale `playwright-core` fora do repo (scratchpad) para não sujar o package.json.

## O que exige credenciais reais

Fluxo completo de agendamento (passos 3–6), dashboard logado, Realtime e
confirmação de pagamento exigem projeto Supabase com as migrations de
`supabase/migrations/` aplicadas + credenciais de teste do Mercado Pago.
