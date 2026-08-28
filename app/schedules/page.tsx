import Link from "next/link";

import { ScheduleCard } from "@/components/schedules/schedule-card";
import { getPublicScheduleMetadata } from "@/lib/schedules/data";
import { createClient } from "@/lib/supabase/server";
import type { ScheduleDifficulty, ScheduleType } from "@/lib/supabase/database.types";

type SearchParams = Promise<{
  view?: string;
  region?: string;
  difficulty?: string;
  type?: string;
}>;

export default async function SchedulesPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = await searchParams;
  const view = filters.view === "past" ? "past" : "upcoming";
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
  const supabase = await createClient();

  let query = supabase.from("schedules").select("*");
  query = view === "upcoming"
    ? query.gte("hiking_date", today).order("hiking_date", { ascending: true })
    : query.lt("hiking_date", today).order("hiking_date", { ascending: false });

  if (filters.region) query = query.eq("region", filters.region);
  if (filters.difficulty) query = query.eq("difficulty", filters.difficulty as ScheduleDifficulty);
  if (filters.type) query = query.eq("schedule_type", filters.type as ScheduleType);

  const [{ data: schedules }, metadata] = await Promise.all([query, getPublicScheduleMetadata()]);

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Link className="text-sm font-semibold text-zinc-600" href="/">← 홈</Link>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-950">산행 일정</h1>
            <p className="mt-2 text-zinc-600">함께 오를 산행을 찾아보세요.</p>
          </div>
          <Link className="primary-button" href="/schedules/new">새 일정 등록</Link>
        </header>

        <form className="mt-8 grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:grid-cols-4" method="get">
          <select className="form-input" name="view" defaultValue={view} aria-label="일정 시기">
            <option value="upcoming">예정 일정</option>
            <option value="past">지난 일정</option>
          </select>
          <input className="form-input" name="region" defaultValue={filters.region ?? ""} placeholder="지역" aria-label="지역" />
          <select className="form-input" name="difficulty" defaultValue={filters.difficulty ?? ""} aria-label="난이도">
            <option value="">전체 난이도</option>
            <option value="easy">쉬움</option><option value="easy_medium">쉬움-보통</option>
            <option value="medium">보통</option><option value="medium_hard">보통-어려움</option><option value="hard">어려움</option>
          </select>
          <select className="form-input" name="type" defaultValue={filters.type ?? ""} aria-label="산행 종류">
            <option value="">전체 종류</option><option value="general">일반</option><option value="theme">테마</option>
            <option value="regular">정기</option><option value="event">이벤트</option>
          </select>
          <button className="secondary-button sm:col-span-4" type="submit">필터 적용</button>
        </form>

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          {(schedules ?? []).map((schedule) => {
            const item = metadata.get(schedule.id);
            return (
              <ScheduleCard
                key={schedule.id}
                schedule={schedule}
                leaderNickname={item?.leader_nickname ?? "알 수 없음"}
                joinedCount={Number(item?.joined_count ?? 0)}
              />
            );
          })}
        </section>
        {!schedules?.length ? <p className="mt-12 text-center text-zinc-600">조건에 맞는 일정이 없습니다.</p> : null}
      </div>
    </main>
  );
}
