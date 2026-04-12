-- Fix: add 'post_stats' to telegram_reminders action_type CHECK constraint
-- The MCP tool and cron handler already support post_stats but the DB rejects it

alter table telegram_reminders
  drop constraint if exists telegram_reminders_action_type_check;

alter table telegram_reminders
  add constraint telegram_reminders_action_type_check
  check (action_type in ('custom', 'stats', 'veille', 'posts', 'resume', 'post_stats'));
