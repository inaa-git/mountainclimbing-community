import { notFound, redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/guards";

export async function requireScheduleLeader(scheduleId: string) {
  const { supabase, user } = await requireUser();
  const { data: schedule } = await supabase
    .from("schedules")
    .select("*")
    .eq("id", scheduleId)
    .single();

  if (!schedule) notFound();
  if (schedule.leader_id !== user.id) redirect(`/schedules/${scheduleId}`);

  return { supabase, user, schedule };
}
