-- GlucoTrack download counter schema
-- Run this in Supabase Dashboard -> SQL Editor

create table if not exists public.downloads (
  id int primary key,
  count bigint not null default 0
);

insert into public.downloads (id, count)
values (1, 0)
on conflict (id) do nothing;

-- Optional hardening: enable RLS so anon/public cannot modify
alter table public.downloads enable row level security;

-- Atomic increment used by Netlify Function GET /download
create or replace function public.increment_downloads()
returns void
language sql
as $$
  update public.downloads set count = count + 1 where id = 1;
$$;
