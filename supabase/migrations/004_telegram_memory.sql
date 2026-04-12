-- Conversation memory for Telegram bot
-- Stores user messages, assistant responses, and compact tool summaries
-- Budget: max ~3000 tokens of history injected per request

create table if not exists telegram_messages (
  id bigserial primary key,
  chat_id text not null,
  role text not null check (role in ('user', 'assistant', 'tool_summary')),
  content text not null,
  token_estimate int not null default 0,
  created_at timestamptz default now()
);

-- Fast lookup: recent messages by chat, newest first
create index idx_tg_messages_chat_time
  on telegram_messages (chat_id, created_at desc);

-- Cleanup policy: app-side purge of messages > 24h
-- No DB trigger — handled in telegram-memory.ts purgeOldMessages()
