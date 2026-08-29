import { notFound, redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/guards";

export async function requireScheduleLeader(scheduleId: string) {
  const { supabase, user } = await requireUser();
  const { data: schedule, error } = await supabase
    .from("schedules")
    .select("*")
    .eq("id", scheduleId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to load schedule for leader authorization (${error.code}): ${error.message}`,
    );
  }

  if (!schedule) notFound();
  if (schedule.leader_id !== user.id) redirect(`/schedules/${scheduleId}`);

  return { supabase, user, schedule };
}
