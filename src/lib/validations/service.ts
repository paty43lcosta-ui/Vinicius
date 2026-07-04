import { z } from 'zod';

export const serviceSchema = z.object({
  name: z.string().min(2, 'Informe o nome do serviço').max(80),
  price: z.coerce
    .number()
    .int('O preço deve ser em centavos')
    .min(100, 'O preço mínimo é R$ 1,00')
    .max(100000000, 'Preço muito alto'),
  duration: z.coerce
    .number()
    .int()
    .min(10, 'A duração mínima é 10 minutos')
    .max(480, 'A duração máxima é 8 horas'),
});

export type ServiceInput = z.infer<typeof serviceSchema>;
