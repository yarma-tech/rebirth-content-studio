-- Veille automatisee — migration 002

-- Flag pour distinguer items auto-detectes des manuels
alter table veille_items add column if not exists auto_detected boolean default false;

-- Index unique sur source_url pour deduplication (ignore les null)
create unique index if not exists idx_veille_source_url_unique
  on veille_items(source_url) where source_url is not null;

-- Table de log des scans de veille
create table if not exists veille_scan_log (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz default now(),
  feeds_checked integer default 0,
  items_found integer default 0,
  items_scored integer default 0,
  items_inserted integer default 0,
  errors jsonb default '[]',
  completed_at timestamptz
);

-- RLS sur scan_log
alter table veille_scan_log enable row level security;

create policy "Service role full access on veille_scan_log"
  on veille_scan_log for all
  using (true)
  with check (true);

-- Seed: sources de veille par defaut
insert into settings (key, value) values
  ('veille_sources', '[
    {"name": "TLDR AI", "url": "https://tldr.tech/ai/rss", "category": "ai_news", "language": "en", "type": "rss"},
    {"name": "TechCrunch AI", "url": "https://techcrunch.com/category/artificial-intelligence/feed/", "category": "ai_news", "language": "en", "type": "rss"},
    {"name": "The Verge AI", "url": "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", "category": "ai_news", "language": "en", "type": "rss"},
    {"name": "VentureBeat AI", "url": "https://venturebeat.com/category/ai/feed/", "category": "ai_news", "language": "en", "type": "rss"},
    {"name": "Maddyness", "url": "https://www.maddyness.com/feed/", "category": "pme_stories", "language": "fr", "type": "rss"},
    {"name": "Anthropic Blog", "url": "https://www.anthropic.com/feed.xml", "category": "ai_news", "language": "en", "type": "rss"},
    {"name": "Google AI Blog", "url": "https://blog.google/technology/ai/rss/", "category": "ai_news", "language": "en", "type": "rss"},
    {"name": "AI Explained (YouTube)", "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCNJ1Ymd5yFuUPtn21xtRbbw", "category": "ai_news", "language": "en", "type": "youtube"}
  ]'::jsonb)
on conflict (key) do nothing;
