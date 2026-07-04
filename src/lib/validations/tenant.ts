import { z } from 'zod';

export const slugSchema = z
  .string()
  .min(3, 'O link precisa de pelo menos 3 caracteres')
  .max(50, 'O link pode ter no máximo 50 caracteres')
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Use apenas letras minúsculas, números e hífens',
  );

export const tenantSettingsSchema = z
  .object({
    name: z.string().min(2, 'Informe o nome da barbearia').max(80),
    slug: slugSchema,
    address: z.string().max(200).optional().or(z.literal('')),
    phone: z.string().max(20).optional().or(z.literal('')),
    hours_start: z.coerce.number().int().min(0).max(23),
    hours_end: z.coerce.number().int().min(1).max(24),
    working_days: z
      .array(z.coerce.number().int().min(0).max(6))
      .min(1, 'Escolha pelo menos um dia de funcionamento'),
    deposit_pct: z.coerce
      .number()
      .int()
      .min(20, 'O sinal mínimo é 20%')
      .max(50, 'O sinal máximo é 50%'),
    mp_access_token: z.string().max(300).optional().or(z.literal('')),
  })
  .refine((data) => data.hours_end > data.hours_start, {
    message: 'O horário de fechamento precisa ser depois da abertura',
    path: ['hours_end'],
  });

export type TenantSettingsInput = z.infer<typeof tenantSettingsSchema>;
