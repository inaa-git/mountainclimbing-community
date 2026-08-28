import { createClient } from "@/lib/supabase/server";

export async function getPublicScheduleMetadata() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_schedule_public_metadata");
  return new Map((data ?? []).map((item) => [item.schedule_id, item]));
}
