-- Creating a schedule and joining it are separate choices. Existing leader
-- participant rows are intentionally preserved; this only changes future writes.
drop trigger if exists on_schedule_created_add_leader on public.schedules;
drop function if exists public.add_schedule_leader_as_participant();

create or replace function public.create_schedule(
  schedule_data jsonb,
  join_as_participant boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  new_schedule_id uuid;
begin
  if current_user_id is null then
    return jsonb_build_object('success', false, 'code', 'unauthenticated');
  end if;

  insert into public.schedules (
    title,
    description,
    schedule_type,
    leader_id,
    hiking_date,
    start_time,
    end_time,
    meeting_location,
    region,
    mountain_name,
    course_description,
    difficulty,
    max_participants,
    preparation,
    transportation,
    estimated_distance_km,
    estimated_duration_minutes,
    status
  )
  values (
    schedule_data ->> 'title',
    nullif(schedule_data ->> 'description', ''),
    schedule_data ->> 'schedule_type',
    current_user_id,
    (schedule_data ->> 'hiking_date')::date,
    (schedule_data ->> 'start_time')::time,
    nullif(schedule_data ->> 'end_time', '')::time,
    schedule_data ->> 'meeting_location',
    nullif(schedule_data ->> 'region', ''),
    schedule_data ->> 'mountain_name',
    nullif(schedule_data ->> 'course_description', ''),
    schedule_data ->> 'difficulty',
    nullif(schedule_data ->> 'max_participants', '')::integer,
    nullif(schedule_data ->> 'preparation', ''),
    nullif(schedule_data ->> 'transportation', ''),
    nullif(schedule_data ->> 'estimated_distance_km', '')::numeric,
    nullif(schedule_data ->> 'estimated_duration_minutes', '')::integer,
    'open'
  )
  returning id into new_schedule_id;

  if join_as_participant then
    insert into public.schedule_participants (schedule_id, user_id, status, joined_at, cancelled_at)
    values (new_schedule_id, current_user_id, 'joined', now(), null);
  end if;

  return jsonb_build_object(
    'success', true,
    'code', 'created',
    'schedule_id', new_schedule_id
  );
exception
  when check_violation or not_null_violation or invalid_text_representation then
    return jsonb_build_object('success', false, 'code', 'invalid_schedule');
end;
$$;

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

  if current_status = 'waitlisted' then
    return jsonb_build_object('success', false, 'code', 'waitlist_reserved');
  end if;

  select count(*) into joined_count
  from public.schedule_participants
  where schedule_id = schedule_uuid and status = 'joined';

  if target_schedule.max_participants is not null and joined_count >= target_schedule.max_participants then
    return jsonb_build_object('success', false, 'code', 'schedule_full');
  end if;

  if current_status = 'cancelled' then
    update public.schedule_participants
    set status = 'joined', joined_at = now(), cancelled_at = null
    where schedule_id = schedule_uuid and user_id = current_user_id;
  else
    insert into public.schedule_participants (schedule_id, user_id, status, joined_at, cancelled_at)
    values (schedule_uuid, current_user_id, 'joined', now(), null);
  end if;

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
  target_status text;
begin
  if current_user_id is null then
    return jsonb_build_object('success', false, 'code', 'unauthenticated');
  end if;

  select status into target_status
  from public.schedules
  where id = schedule_uuid
  for update;

  if not found then
    return jsonb_build_object('success', false, 'code', 'not_found');
  end if;

  if target_status in ('completed', 'cancelled') then
    return jsonb_build_object('success', false, 'code', 'schedule_finalized');
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

-- Schedule creation for API users is RPC-only. Keep the existing INSERT RLS
-- policy as defense in depth in case table privileges are granted again later.
revoke insert on table public.schedules from anon, authenticated;

revoke execute on function public.create_schedule(jsonb, boolean) from public, anon, authenticated;
revoke execute on function public.join_schedule(uuid) from public, anon, authenticated;
revoke execute on function public.cancel_schedule_participation(uuid) from public, anon, authenticated;

grant execute on function public.create_schedule(jsonb, boolean) to authenticated;
grant execute on function public.join_schedule(uuid) to authenticated;
grant execute on function public.cancel_schedule_participation(uuid) to authenticated;
