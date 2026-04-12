-- Scheduled reminders for the Telegram bot
-- Supports one-shot and recurring (daily/weekly) reminders
-- action_type determines what the cron fetches and sends (live data, not static text)

create table if not exists telegram_reminders (
  id uuid primary key default gen_random_uuid(),
  chat_id text not null,

  -- What to do
  action_type text not null check (action_type in ('custom', 'stats', 'veille', 'posts', 'resume')),
  custom_message text,           -- for action_type='custom' (rappel texte libre)
  action_params jsonb default '{}',  -- ex: {"limit": 3, "min_score": 0.5} for veille

  -- When to do it
  scheduled_at timestamptz not null,
  frequency text not null default 'once' check (frequency in ('once', 'daily', 'weekly')),

  -- Status
  status text not null default 'active' check (status in ('active', 'sent', 'cancelled')),
  last_sent_at timestamptz,

  created_at timestamptz default now()
);

create index idx_reminders_due
  on telegram_reminders (scheduled_at)
  where status = 'active';
