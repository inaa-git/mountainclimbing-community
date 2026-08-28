create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  schedule_type text not null,
  leader_id uuid not null references public.profiles(id),
  hiking_date date not null,
  start_time time not null,
  end_time time,
  meeting_location text not null,
  region text,
  mountain_name text not null,
  course_description text,
  difficulty text not null,
  max_participants integer,
  preparation text,
  transportation text,
  estimated_distance_km numeric,
  estimated_duration_minutes integer,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schedules_title_not_blank check (length(btrim(title)) > 0),
  constraint schedules_meeting_location_not_blank check (length(btrim(meeting_location)) > 0),
  constraint schedules_mountain_name_not_blank check (length(btrim(mountain_name)) > 0),
  constraint schedules_type_check check (schedule_type in ('general', 'theme', 'regular', 'event')),
  constraint schedules_difficulty_check check (
    difficulty in ('easy', 'easy_medium', 'medium', 'medium_hard', 'hard')
  ),
  constraint schedules_status_check check (status in ('open', 'closed', 'completed', 'cancelled')),
  constraint schedules_max_participants_check check (max_participants is null or max_participants >= 1),
  constraint schedules_distance_check check (estimated_distance_km is null or estimated_distance_km >= 0),
  constraint schedules_duration_check check (
    estimated_duration_minutes is null or estimated_duration_minutes >= 0
  )
);

create table public.schedule_participants (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.schedules(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'joined',
  joined_at timestamptz not null default now(),
  cancelled_at timestamptz,
  constraint schedule_participants_status_check check (status in ('joined', 'cancelled', 'waitlisted')),
  constraint schedule_participants_schedule_user_key unique (schedule_id, user_id)
);

create index schedules_hiking_date_idx on public.schedules(hiking_date);
create index schedules_status_idx on public.schedules(status);
create index schedules_leader_id_idx on public.schedules(leader_id);
create index schedules_upcoming_idx on public.schedules(hiking_date, status);
create index schedule_participants_schedule_id_idx on public.schedule_participants(schedule_id);
create index schedule_participants_user_id_idx on public.schedule_participants(user_id);
create index schedule_participants_joined_idx
on public.schedule_participants(schedule_id, status)
where status = 'joined';

create trigger schedules_set_updated_at
before update on public.schedules
for each row execute function public.set_updated_at();

create or replace function public.add_schedule_leader_as_participant()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.schedule_participants (schedule_id, user_id, status)
  values (new.id, new.leader_id, 'joined');
  return new;
end;
$$;

create trigger on_schedule_created_add_leader
after insert on public.schedules
for each row execute function public.add_schedule_leader_as_participant();

create or replace function public.prevent_capacity_below_joined()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  joined_count integer;
begin
  if new.max_participants is not null and new.max_participants is distinct from old.max_participants then
    select count(*) into joined_count
    from public.schedule_participants
    where schedule_id = new.id and status = 'joined';

    if new.max_participants < joined_count then
      raise exception using errcode = 'P0001', message = 'capacity_below_joined';
    end if;
  end if;
  return new;
end;
$$;

create trigger schedules_prevent_capacity_below_joined
before update of max_participants on public.schedules
for each row execute function public.prevent_capacity_below_joined();

create or replace function public.join_schedule(schedule_uuid uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_schedule public.schedules%rowtype;
  current_status text;
  joined_count integer;
begin
  if current_user_id is null then
    return jsonb_build_object('success', false, 'code', 'unauthenticated');
  end if;

  select * into target_schedule
  from public.schedules
  where id = schedule_uuid
  for update;

  if not found then
    return jsonb_build_object('success', false, 'code', 'not_found');
  end if;

  if target_schedule.status <> 'open' then
    return jsonb_build_object('success', false, 'code', 'schedule_not_open');
  end if;

  select status into current_status
  from public.schedule_participants
  where schedule_id = schedule_uuid and user_id = current_user_id;

  if current_status = 'joined' then
    return jsonb_build_object('success', true, 'code', 'already_joined');
  end if;

  select count(*) into joined_count
  from public.schedule_participants
  where schedule_id = schedule_uuid and status = 'joined';

  if target_schedule.max_participants is not null and joined_count >= target_schedule.max_participants then
    return jsonb_build_object('success', false, 'code', 'schedule_full');
  end if;

  insert into public.schedule_participants (schedule_id, user_id, status, joined_at, cancelled_at)
  values (schedule_uuid, current_user_id, 'joined', now(), null)
  on conflict (schedule_id, user_id) do update
  set status = 'joined', joined_at = now(), cancelled_at = null;

  return jsonb_build_object('success', true, 'code', 'joined');
end;
$$;

create or replace function public.cancel_schedule_participation(schedule_uuid uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_leader_id uuid;
begin
  if current_user_id is null then
    return jsonb_build_object('success', false, 'code', 'unauthenticated');
  end if;

  select leader_id into target_leader_id
  from public.schedules
  where id = schedule_uuid
  for update;

  if not found then
    return jsonb_build_object('success', false, 'code', 'not_found');
  end if;

  if target_leader_id = current_user_id then
    return jsonb_build_object('success', false, 'code', 'leader_cannot_cancel');
  end if;

  update public.schedule_participants
  set status = 'cancelled', cancelled_at = now()
  where schedule_id = schedule_uuid and user_id = current_user_id and status = 'joined';

  if not found then
    return jsonb_build_object('success', false, 'code', 'not_joined');
  end if;

  return jsonb_build_object('success', true, 'code', 'cancelled');
end;
$$;

create or replace function public.get_schedule_public_metadata()
returns table (schedule_id uuid, leader_nickname text, joined_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select
    s.id,
    p.nickname,
    count(sp.id) filter (where sp.status = 'joined')
  from public.schedules s
  join public.profiles p on p.id = s.leader_id
  left join public.schedule_participants sp on sp.schedule_id = s.id
  group by s.id, p.nickname;
$$;

alter table public.schedules enable row level security;
alter table public.schedule_participants enable row level security;

create policy "Schedules are publicly readable"
on public.schedules for select
to anon, authenticated
using (true);

create policy "Authenticated users can create schedules as themselves"
on public.schedules for insert
to authenticated
with check ((select auth.uid()) = leader_id);

create policy "Leaders can update their own schedules"
on public.schedules for update
to authenticated
using ((select auth.uid()) = leader_id)
with check ((select auth.uid()) = leader_id);

create policy "Authenticated users can view schedule participants"
on public.schedule_participants for select
to authenticated
using (true);

revoke all on table public.schedules from anon, authenticated;
grant select on table public.schedules to anon, authenticated;
grant insert on table public.schedules to authenticated;
grant update (
  title, description, schedule_type, hiking_date, start_time, end_time,
  meeting_location, region, mountain_name, course_description, difficulty,
  max_participants, preparation, transportation, estimated_distance_km,
  estimated_duration_minutes, status
) on table public.schedules to authenticated;

revoke all on table public.schedule_participants from anon, authenticated;
grant select on table public.schedule_participants to authenticated;

revoke all on function public.add_schedule_leader_as_participant() from public, anon, authenticated;
revoke all on function public.prevent_capacity_below_joined() from public, anon, authenticated;
revoke all on function public.join_schedule(uuid) from public, anon;
revoke all on function public.cancel_schedule_participation(uuid) from public, anon;
grant execute on function public.join_schedule(uuid) to authenticated;
grant execute on function public.cancel_schedule_participation(uuid) to authenticated;
grant execute on function public.get_schedule_public_metadata() to anon, authenticated;
