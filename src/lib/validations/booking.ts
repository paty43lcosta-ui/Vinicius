import { z } from 'zod';

export const clientDataSchema = z.object({
  client_name: z.string().min(2, 'Informe seu nome').max(80),
  client_phone: z
    .string()
    .min(10, 'Informe um telefone válido com DDD')
    .max(20)
    .regex(/^[\d\s()+-]+$/, 'Informe um telefone válido'),
  client_email: z
    .string()
    .email('Informe um e-mail válido')
    .optional()
    .or(z.literal('')),
});

export const bookingDraftSchema = clientDataSchema.extend({
  tenant_id: z.string().uuid(),
  service_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  time_slot: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido'),
  payment_method: z.enum(['pix', 'credit_card']),
});

export type ClientDataInput = z.infer<typeof clientDataSchema>;
export type BookingDraftInput = z.infer<typeof bookingDraftSchema>;
