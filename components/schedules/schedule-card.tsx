import Link from "next/link";

import {
  difficultyLabels,
  formatHikingDate,
  formatHikingTime,
  scheduleStatusLabels,
  scheduleTypeLabels,
} from "@/lib/schedules/format";
import type { Database } from "@/lib/supabase/database.types";

type Schedule = Database["public"]["Tables"]["schedules"]["Row"];

export function ScheduleCard({
  schedule,
  leaderNickname,
  joinedCount,
}: {
  schedule: Schedule;
  leaderNickname: string;
  joinedCount: number;
}) {
  const remaining = schedule.max_participants === null ? null : Math.max(schedule.max_participants - joinedCount, 0);

  return (
    <Link
      className="group block rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 sm:p-6"
      href={`/schedules/${schedule.id}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
          {scheduleTypeLabels[schedule.schedule_type]}
        </span>
        <span className="text-sm font-semibold text-zinc-600">{scheduleStatusLabels[schedule.status]}</span>
      </div>
      <h2 className="mt-4 text-xl font-bold tracking-tight text-zinc-950 group-hover:text-emerald-800">{schedule.title}</h2>
      <dl className="mt-4 grid gap-2 text-sm text-zinc-700 sm:grid-cols-2">
        <div><dt className="sr-only">날짜</dt><dd>{formatHikingDate(schedule.hiking_date)}</dd></div>
        <div><dt className="sr-only">시간</dt><dd>{formatHikingTime(schedule.start_time)}</dd></div>
        <div><dt className="sr-only">산</dt><dd>{schedule.mountain_name}</dd></div>
        <div><dt className="sr-only">지역</dt><dd>{schedule.region || "지역 미정"}</dd></div>
        <div><dt className="sr-only">난이도</dt><dd>{difficultyLabels[schedule.difficulty]}</dd></div>
        <div><dt className="sr-only">작성자</dt><dd>작성자 {leaderNickname}</dd></div>
      </dl>
      <div className="mt-5 border-t border-zinc-100 pt-4 text-sm font-medium text-zinc-800">
        {schedule.max_participants === null ? (
          <span>참가 {joinedCount}명</span>
        ) : (
          <div className="flex flex-wrap justify-between gap-2">
            <span>참가 {joinedCount} / {schedule.max_participants}</span>
            <span>남은 자리 {remaining}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
