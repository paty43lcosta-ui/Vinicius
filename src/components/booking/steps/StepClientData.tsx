'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  clientDataSchema,
  type ClientDataInput,
} from '@/lib/validations/booking';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type Props = {
  defaultValues?: ClientDataInput;
  onSubmit: (data: ClientDataInput) => void;
};

export function StepClientData({ defaultValues, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientDataInput>({
    resolver: zodResolver(clientDataSchema),
    defaultValues,
  });

  return (
    <section aria-label="Seus dados">
      <h2 className="mb-4 font-display text-2xl font-bold uppercase tracking-wide">
        Seus dados
      </h2>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
        noValidate
      >
        <Input
          label="Nome"
          autoComplete="name"
          placeholder="Seu nome"
          error={errors.client_name?.message}
          {...register('client_name')}
        />
        <Input
          label="WhatsApp / Telefone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="(11) 99999-9999"
          error={errors.client_phone?.message}
          {...register('client_phone')}
        />
        <Input
          label="E-mail (opcional)"
          type="email"
          autoComplete="email"
          placeholder="Para receber a confirmação"
          error={errors.client_email?.message}
          {...register('client_email')}
        />
        <Button type="submit" size="lg">
          Continuar para o pagamento
        </Button>
      </form>
    </section>
  );
}
