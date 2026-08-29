alter table public.schedules
  add constraint schedules_title_length_check
    check (
      char_length(btrim(title)) >= 2
      and char_length(title) <= 100
    ),
  add constraint schedules_description_length_check
    check (description is null or char_length(description) <= 2000),
  add constraint schedules_meeting_location_length_check
    check (
      char_length(btrim(meeting_location)) >= 1
      and char_length(meeting_location) <= 200
    ),
  add constraint schedules_region_length_check
    check (region is null or char_length(region) <= 50),
  add constraint schedules_mountain_name_length_check
    check (
      char_length(btrim(mountain_name)) >= 1
      and char_length(mountain_name) <= 100
    ),
  add constraint schedules_course_description_length_check
    check (course_description is null or char_length(course_description) <= 1000),
  add constraint schedules_preparation_length_check
    check (preparation is null or char_length(preparation) <= 1000),
  add constraint schedules_transportation_length_check
    check (transportation is null or char_length(transportation) <= 500),
  add constraint schedules_time_order_check
    check (end_time is null or end_time > start_time);

comment on constraint schedules_time_order_check on public.schedules is
  'MVP schedules must end after they start on the same day. Replace this constraint before supporting overnight hikes.';

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

  -- waitlisted is reserved for a future waitlist workflow and must not be
  -- promoted by the normal join endpoint.
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
  target_leader_id uuid;
  target_status text;
begin
  if current_user_id is null then
    return jsonb_build_object('success', false, 'code', 'unauthenticated');
  end if;

  select leader_id, status into target_leader_id, target_status
  from public.schedules
  where id = schedule_uuid
  for update;

  if not found then
    return jsonb_build_object('success', false, 'code', 'not_found');
  end if;

  if target_leader_id = current_user_id then
    return jsonb_build_object('success', false, 'code', 'leader_cannot_cancel');
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

-- SECURITY DEFINER functions receive EXECUTE for PUBLIC by default. Keep this
-- public-facing aggregate callable only through Supabase's API roles.
revoke execute on function public.get_schedule_public_metadata() from public;
grant execute on function public.get_schedule_public_metadata() to anon, authenticated;
