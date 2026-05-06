alter table public.bookings
  add column if not exists razorpay_order_id text,
  add column if not exists razorpay_signature text,
  add column if not exists payment_provider text not null default 'razorpay',
  add column if not exists payment_verified_at timestamptz;

create unique index if not exists bookings_payment_id_unique_idx
  on public.bookings(payment_id)
  where payment_id is not null and payment_id <> '';
