import type { ScheduleDifficulty, ScheduleStatus, ScheduleType } from "@/lib/supabase/database.types";

export const scheduleTypeLabels: Record<ScheduleType, string> = {
  general: "일반 산행",
  theme: "테마 산행",
  regular: "정기 산행",
  event: "이벤트",
};

export const difficultyLabels: Record<ScheduleDifficulty, string> = {
  easy: "쉬움",
  easy_medium: "쉬움-보통",
  medium: "보통",
  medium_hard: "보통-어려움",
  hard: "어려움",
};

export const scheduleStatusLabels: Record<ScheduleStatus, string> = {
  open: "모집 중",
  closed: "모집 마감",
  completed: "완료",
  cancelled: "취소됨",
};

export function formatHikingDate(date: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "long",
    timeZone: "Asia/Seoul",
  }).format(new Date(`${date}T00:00:00+09:00`));
}

export function formatHikingTime(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date(Date.UTC(2020, 0, 1, hour - 9, minute)));
}
