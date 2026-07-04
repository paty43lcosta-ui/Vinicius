'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkSlugAvailability, signUp } from '@/actions/auth';
import { signUpSchema, type SignUpInput } from '@/lib/validations/auth';
import { generateSlug } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken';

export default function SignUpPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle');
  const [slugEdited, setSlugEdited] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({ resolver: zodResolver(signUpSchema) });

  const shopName = watch('shopName');
  const slug = watch('slug');

  // Gera o slug automaticamente a partir do nome (até o usuário editar)
  useEffect(() => {
    if (!slugEdited) {
      setValue('slug', generateSlug(shopName ?? ''), { shouldValidate: false });
    }
  }, [shopName, slugEdited, setValue]);

  // Checa unicidade do slug com debounce de 400ms
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!slug || slug.length < 3) {
      setSlugStatus('idle');
      return;
    }
    setSlugStatus('checking');
    debounceRef.current = setTimeout(async () => {
      try {
        const { available } = await checkSlugAvailability(slug);
        setSlugStatus(available ? 'available' : 'taken');
      } catch {
        setSlugStatus('idle');
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [slug]);

  async function onSubmit(data: SignUpInput) {
    setServerError(null);
    if (slugStatus === 'taken') {
      setServerError('Esse link já está em uso. Escolha outro para sua barbearia.');
      return;
    }
    const result = await signUp(data);
    if (result?.error) setServerError(result.error);
  }

  const slugHint =
    slugStatus === 'checking'
      ? 'Verificando disponibilidade…'
      : slugStatus === 'available'
        ? '✓ Link disponível'
        : undefined;

  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide">
        Criar conta
      </h1>
      <p className="mt-1 text-sm text-cream/60">
        Cadastre sua barbearia e comece a receber agendamentos com sinal.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 flex flex-col gap-4"
        noValidate
      >
        <Input
          label="Seu nome"
          autoComplete="name"
          placeholder="João da Silva"
          error={errors.name?.message}
          {...register('name')}
        />
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
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Nome da barbearia"
          placeholder="Barbearia do João"
          error={errors.shopName?.message}
          {...register('shopName')}
        />
        <Input
          label="Link da sua página"
          prefix="agendabarba.com.br/b/"
          placeholder="barbearia-do-joao"
          error={
            errors.slug?.message ??
            (slugStatus === 'taken' ? 'Esse link já está em uso' : undefined)
          }
          hint={slugHint}
          {...register('slug', {
            onChange: () => setSlugEdited(true),
          })}
        />

        {serverError && (
          <p
            role="alert"
            className="rounded-lg border border-barber-red/50 bg-barber-red/10 px-3 py-2 text-sm text-red-300"
          >
            {serverError}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          loading={isSubmitting}
          disabled={slugStatus === 'taken'}
        >
          Criar minha barbearia
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-cream/60">
        Já tem conta?{' '}
        <Link href="/entrar" className="text-brass hover:text-brass-light">
          Entrar
        </Link>
      </p>
    </div>
  );
}
