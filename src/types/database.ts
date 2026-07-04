export type BookingStatus =
  | 'aguardando_pagamento'
  | 'confirmado'
  | 'cancelado'
  | 'concluido';

export type Tenant = {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  address: string | null;
  phone: string | null;
  hours_start: number;
  hours_end: number;
  working_days: number[];
  mp_access_token: string | null;
  deposit_pct: number;
  deposit_min: number;
  active: boolean;
  created_at: string;
};

export type Service = {
  id: string;
  tenant_id: string;
  name: string;
  price: number; // centavos
  duration: number; // minutos
  active: boolean;
  position: number;
  created_at: string;
};

export type Booking = {
  id: string;
  tenant_id: string;
  service_id: string;
  date: string; // 'YYYY-MM-DD'
  time_slot: string; // 'HH:MM:SS'
  client_name: string;
  client_phone: string;
  client_email: string | null;
  status: BookingStatus;
  total_amount: number; // centavos
  deposit_amount: number; // centavos
  remaining_amount: number; // centavos
  mp_preference_id: string | null;
  mp_payment_id: string | null;
  payment_method: string | null;
  payment_at: string | null;
  notes: string | null;
  created_at: string;
};

export type FinancialSummary = {
  tenant_id: string;
  month: string;
  total_bookings: number | null;
  total_deposits: number | null;
  total_revenue: number | null;
};

export type BookingWithService = Booking & {
  services: Pick<Service, 'name' | 'duration'> | null;
};

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: Tenant;
        Insert: Partial<Tenant> &
          Pick<Tenant, 'owner_id' | 'slug' | 'name'>;
        Update: Partial<Tenant>;
        Relationships: [];
      };
      services: {
        Row: Service;
        Insert: Partial<Service> &
          Pick<Service, 'tenant_id' | 'name' | 'price' | 'duration'>;
        Update: Partial<Service>;
        Relationships: [
          {
            foreignKeyName: 'services_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      bookings: {
        Row: Booking;
        Insert: Partial<Booking> &
          Pick<
            Booking,
            | 'tenant_id'
            | 'service_id'
            | 'date'
            | 'time_slot'
            | 'client_name'
            | 'client_phone'
            | 'total_amount'
            | 'deposit_amount'
            | 'remaining_amount'
          >;
        Update: Partial<Booking>;
        Relationships: [
          {
            foreignKeyName: 'bookings_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_service_id_fkey';
            columns: ['service_id'];
            isOneToOne: false;
            referencedRelation: 'services';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      financial_summary: {
        Row: FinancialSummary;
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: {
      booking_status: BookingStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
