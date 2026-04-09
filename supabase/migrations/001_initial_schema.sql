-- Rebirth Content Studio — Initial Schema
-- MVP: posts, veille_items, post_analytics, settings

-- Posts LinkedIn
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  title text,
  content text not null,
  pillar text check (pillar in ('build_in_public', 'vulgarisation', 'retour_terrain')),
  status text not null default 'draft'
    check (status in ('idea', 'draft', 'ready', 'scheduled', 'published', 'archived')),
  scheduled_at timestamptz,
  published_at timestamptz,
  linkedin_post_id text,
  source_veille_id uuid,
  hashtags text[] default '{}',
  media_urls text[] default '{}',
  ai_generated boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Items de veille
create table if not exists veille_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  pme_angle text,
  source_url text,
  source_name text,
  suggested_format text check (suggested_format in ('post', 'video', 'both')),
  urgency text check (urgency in ('immediate', 'this_week', 'backlog')),
  relevance_score float,
  status text not null default 'new'
    check (status in ('new', 'reviewed', 'used', 'dismissed')),
  used_in_post_id uuid references posts(id) on delete set null,
  raw_data jsonb,
  detected_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Add foreign key for source_veille_id after veille_items exists
alter table posts
  add constraint fk_posts_source_veille
  foreign key (source_veille_id) references veille_items(id) on delete set null;

-- Métriques LinkedIn
create table if not exists post_analytics (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  impressions integer default 0,
  likes integer default 0,
  comments integer default 0,
  shares integer default 0,
  clicks integer default 0,
  engagement_rate float,
  snapshot_at timestamptz default now()
);

-- Configuration
create table if not exists settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_posts_status on posts(status);
create index if not exists idx_posts_created_at on posts(created_at desc);
create index if not exists idx_posts_pillar on posts(pillar);
create index if not exists idx_veille_status on veille_items(status);
create index if not exists idx_veille_detected_at on veille_items(detected_at desc);
create index if not exists idx_analytics_post_id on post_analytics(post_id);

-- RLS (Row Level Security)
alter table posts enable row level security;
alter table veille_items enable row level security;
alter table post_analytics enable row level security;
alter table settings enable row level security;

-- Policies — mono-utilisateur: accès complet via service role key
-- Les API routes utilisent le service role key, pas d'anon access nécessaire
create policy "Service role full access on posts"
  on posts for all
  using (true)
  with check (true);

create policy "Service role full access on veille_items"
  on veille_items for all
  using (true)
  with check (true);

create policy "Service role full access on post_analytics"
  on post_analytics for all
  using (true)
  with check (true);

create policy "Service role full access on settings"
  on settings for all
  using (true)
  with check (true);

-- Seed data: default settings
insert into settings (key, value) values
  ('content_strategy', '{"pillars": ["build_in_public", "vulgarisation", "retour_terrain"], "posting_days": ["tuesday", "thursday"], "newsletter_day": "friday", "target_posts_per_week": 2}'::jsonb),
  ('ai_preferences', '{"model": "claude-sonnet-4-20250514", "tone": "accessible", "language": "fr"}'::jsonb)
on conflict (key) do nothing;
