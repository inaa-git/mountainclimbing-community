"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/guards";
import { requireScheduleLeader } from "@/lib/schedules/guards";
import { isCapacityValid } from "@/lib/schedules/rules";
import { scheduleFormSchema, type ScheduleFormValues } from "@/lib/schedules/validation";

export interface ScheduleActionResult {
  success: boolean;
  message: string;
  scheduleId?: string;
}

function toSchedulePayload(values: ScheduleFormValues) {
  return {
    title: values.title.trim(),
    description: values.description || null,
    schedule_type: values.schedule_type,
    hiking_date: values.hiking_date,
    start_time: values.start_time,
    end_time: values.end_time || null,
    meeting_location: values.meeting_location.trim(),
    region: values.region || null,
    mountain_name: values.mountain_name.trim(),
    course_description: values.course_description || null,
    difficulty: values.difficulty,
    max_participants: values.max_participants,
    preparation: values.preparation || null,
    transportation: values.transportation || null,
    estimated_distance_km: values.estimated_distance_km,
    estimated_duration_minutes: values.estimated_duration_minutes,
    status: values.status,
  };
}

export async function createSchedule(input: unknown): Promise<ScheduleActionResult> {
  const parsed = scheduleFormSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "입력값을 다시 확인해주세요." };

  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("schedules")
    .insert({ ...toSchedulePayload(parsed.data), leader_id: user.id })
    .select("id")
    .single();

  if (error || !data) return { success: false, message: "일정을 등록하지 못했습니다." };

  revalidatePath("/schedules");
  return { success: true, message: "일정을 등록했습니다.", scheduleId: data.id };
}

export async function updateSchedule(scheduleId: string, input: unknown): Promise<ScheduleActionResult> {
  if (!z.uuid().safeParse(scheduleId).success) return { success: false, message: "잘못된 일정입니다." };
  const parsed = scheduleFormSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "입력값을 다시 확인해주세요." };

  const { supabase } = await requireScheduleLeader(scheduleId);
  const { count } = await supabase
    .from("schedule_participants")
    .select("id", { count: "exact", head: true })
    .eq("schedule_id", scheduleId)
    .eq("status", "joined");

  if (!isCapacityValid(parsed.data.max_participants, count ?? 0)) {
    return { success: false, message: "현재 참가 인원보다 정원을 작게 설정할 수 없습니다." };
  }

  const { error } = await supabase
    .from("schedules")
    .update(toSchedulePayload(parsed.data))
    .eq("id", scheduleId);

  if (error?.message.includes("capacity_below_joined")) {
    return { success: false, message: "현재 참가 인원보다 정원을 작게 설정할 수 없습니다." };
  }
  if (error) return { success: false, message: "일정을 수정하지 못했습니다." };

  revalidatePath("/schedules");
  revalidatePath(`/schedules/${scheduleId}`);
  return { success: true, message: "일정을 수정했습니다.", scheduleId };
}

const participationMessages: Record<string, string> = {
  joined: "참가 신청이 완료되었습니다.",
  already_joined: "이미 참가 중인 일정입니다.",
  cancelled: "참가를 취소했습니다.",
  schedule_full: "정원이 모두 찼습니다.",
  schedule_not_open: "현재 참가할 수 없는 일정입니다.",
  schedule_finalized: "완료되거나 취소된 일정에서는 참가를 취소할 수 없습니다.",
  waitlist_reserved: "대기 상태는 현재 참가 기능에서 변경할 수 없습니다.",
  leader_cannot_cancel: "리더는 참가를 취소할 수 없습니다.",
  not_joined: "참가 중인 일정이 아닙니다.",
  not_found: "일정을 찾을 수 없습니다.",
  unauthenticated: "로그인이 필요합니다.",
};

async function runParticipationRpc(
  functionName: "join_schedule" | "cancel_schedule_participation",
  scheduleId: string,
): Promise<ScheduleActionResult> {
  if (!z.uuid().safeParse(scheduleId).success) return { success: false, message: "잘못된 일정입니다." };
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc(functionName, { schedule_uuid: scheduleId });

  if (error || !data) return { success: false, message: "요청을 처리하지 못했습니다." };
  const result = data as { success: boolean; code: string };
  revalidatePath("/schedules");
  revalidatePath(`/schedules/${scheduleId}`);
  return {
    success: result.success,
    message: participationMessages[result.code] ?? "요청을 처리했습니다.",
  };
}

export async function joinSchedule(scheduleId: string) {
  return runParticipationRpc("join_schedule", scheduleId);
}

export async function cancelScheduleParticipation(scheduleId: string) {
  return runParticipationRpc("cancel_schedule_participation", scheduleId);
}
