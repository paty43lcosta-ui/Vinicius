import 'server-only';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';

/**
 * Retorna clientes do SDK do Mercado Pago.
 * Usa o token do tenant (conta conectada) quando disponível;
 * caso contrário, o token da plataforma.
 */
export function getMercadoPago(tenantAccessToken?: string | null) {
  const accessToken = tenantAccessToken || process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error(
      'Mercado Pago não configurado: defina MP_ACCESS_TOKEN ou conecte a conta da barbearia.',
    );
  }
  const client = new MercadoPagoConfig({ accessToken });
  return {
    payment: new Payment(client),
    preference: new Preference(client),
  };
}

/** Converte centavos para o valor decimal esperado pela API do MP. */
export function centsToAmount(cents: number): number {
  return Number((cents / 100).toFixed(2));
}
