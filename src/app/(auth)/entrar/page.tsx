'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from '@/actions/auth';
import { signInSchema, type SignInInput } from '@/lib/validations/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SignInPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({ resolver: zodResolver(signInSchema) });

  async function onSubmit(data: SignInInput) {
    setServerError(null);
    const result = await signIn(data);
    if (result?.error) setServerError(result.error);
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide">
        Entrar
      </h1>
      <p className="mt-1 text-sm text-cream/60">
        Acesse o painel da sua barbearia.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 flex flex-col gap-4"
        noValidate
      >
        <Input
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="voce@email.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Senha"
          type="password"
          autoComplete="current-password"
          placeholder="Sua senha"
          error={errors.password?.message}
          {...register('password')}
        />

        {serverError && (
          <p
            role="alert"
            className="rounded-lg border border-barber-red/50 bg-barber-red/10 px-3 py-2 text-sm text-red-300"
          >
            {serverError}
          </p>
        )}

        <Button type="submit" size="lg" loading={isSubmitting}>
          Entrar
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-cream/60">
        Ainda não tem conta?{' '}
        <Link href="/cadastro" className="text-brass hover:text-brass-light">
          Cadastre sua barbearia
        </Link>
      </p>
    </div>
  );
}
