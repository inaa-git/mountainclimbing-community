create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null unique,
  profile_image_url text,
  region text,
  introduction text,
  hiking_level text,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_nickname_not_blank check (length(btrim(nickname)) > 0),
  constraint profiles_nickname_length check (char_length(nickname) between 2 and 20),
  constraint profiles_hiking_level_check check (
    hiking_level is null or hiking_level in ('beginner', 'intermediate', 'advanced')
  ),
  constraint profiles_role_check check (role in ('user', 'moderator', 'admin'))
);

comment on table public.profiles is 'Public-facing member profiles linked one-to-one with auth.users.';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_nickname text;
  base_nickname text;
  candidate_nickname text;
  suffix text;
  attempt integer := 0;
begin
  requested_nickname := btrim(coalesce(new.raw_user_meta_data ->> 'nickname', ''));

  if char_length(requested_nickname) between 2 and 20 then
    base_nickname := requested_nickname;
  else
    base_nickname := 'hiker';
  end if;

  loop
    if attempt = 0 then
      candidate_nickname := base_nickname;
    else
      suffix := '_' || substr(replace(new.id::text, '-', ''), 1, 6) || attempt::text;
      candidate_nickname := left(base_nickname, 20 - char_length(suffix)) || suffix;
    end if;

    insert into public.profiles (id, nickname)
    values (new.id, candidate_nickname)
    on conflict (nickname) do nothing;

    if found then
      return new;
    end if;

    attempt := attempt + 1;
    if attempt > 9 then
      raise exception 'Could not generate a unique nickname for user %', new.id;
    end if;
  end loop;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

create policy "Authenticated users can view profiles"
on public.profiles
for select
to authenticated
using (true);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (nickname, profile_image_url, region, introduction, hiking_level)
on table public.profiles to authenticated;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
