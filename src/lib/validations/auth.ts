import { z } from 'zod';
import { slugSchema } from './tenant';

export const signUpSchema = z.object({
  name: z.string().min(2, 'Informe seu nome'),
  email: z.string().email('Informe um e-mail válido'),
  password: z.string().min(8, 'A senha precisa de pelo menos 8 caracteres'),
  shopName: z.string().min(2, 'Informe o nome da barbearia').max(80),
  slug: slugSchema,
});

export const signInSchema = z.object({
  email: z.string().email('Informe um e-mail válido'),
  password: z.string().min(1, 'Informe sua senha'),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
