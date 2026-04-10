-- Newsletter + Subscribers — migration 003

-- Abonnes newsletter
create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  first_name text,
  interests text[] default '{}',
  source text default 'website' check (source in ('linkedin', 'website', 'manual', 'other')),
  status text not null default 'active' check (status in ('active', 'unsubscribed', 'bounced')),
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  created_at timestamptz default now()
);

-- Editions de newsletter
create table if not exists newsletters (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  intro text,
  content_html text,
  content_json jsonb,
  status text not null default 'draft' check (status in ('draft', 'ready', 'sending', 'sent')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  recipient_count integer default 0,
  open_count integer default 0,
  click_count integer default 0,
  unsubscribe_count integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_subscribers_status on subscribers(status);
create index if not exists idx_subscribers_email on subscribers(email);
create index if not exists idx_newsletters_status on newsletters(status);
create index if not exists idx_newsletters_created on newsletters(created_at desc);

-- RLS
alter table subscribers enable row level security;
alter table newsletters enable row level security;

create policy "Service role full access on subscribers"
  on subscribers for all using (true) with check (true);

create policy "Service role full access on newsletters"
  on newsletters for all using (true) with check (true);
