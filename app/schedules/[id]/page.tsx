import Link from "next/link";
import { notFound } from "next/navigation";

import { ParticipantAuthorBadge } from "@/components/schedules/participant-author-badge";
import { ParticipationButton } from "@/components/schedules/participation-button";
import { getPublicScheduleMetadata } from "@/lib/schedules/data";
import {
  difficultyLabels,
  formatHikingDate,
  formatHikingTime,
  scheduleStatusLabels,
  scheduleTypeLabels,
} from "@/lib/schedules/format";
import { createClient } from "@/lib/supabase/server";

export default async function ScheduleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: schedule }, metadata, authResult] = await Promise.all([
    supabase.from("schedules").select("*").eq("id", id).single(),
    getPublicScheduleMetadata(),
    supabase.auth.getUser(),
  ]);

  if (!schedule) notFound();

  const user = authResult.data.user;
  const publicMetadata = metadata.get(id);
  const joinedCount = Number(publicMetadata?.joined_count ?? 0);
  const isLeader = user?.id === schedule.leader_id;
  let isJoined = false;
  let participants: Array<{
    userId: string;
    nickname: string;
    region: string | null;
    hikingLevel: string | null;
  }> = [];

  if (user) {
    const { data: participantRows } = await supabase
      .from("schedule_participants")
      .select("user_id")
      .eq("schedule_id", id)
      .eq("status", "joined");
    const userIds = (participantRows ?? []).map((item) => item.user_id);
    isJoined = userIds.includes(user.id);

    if (userIds.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, nickname, region, hiking_level")
        .in("id", userIds);
      participants = (profiles ?? []).map((profile) => ({
        userId: profile.id,
        nickname: profile.nickname,
        region: profile.region,
        hikingLevel: profile.hiking_level,
      }));
    }
  }

  const isFull = schedule.max_participants !== null && joinedCount >= schedule.max_participants;

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link className="text-sm font-semibold text-zinc-600" href="/schedules">← 일정 목록</Link>
          {isLeader ? <Link className="secondary-button" href={`/schedules/${id}/edit`}>일정 수정</Link> : null}
        </div>

        <article className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-9">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">
              {scheduleTypeLabels[schedule.schedule_type]}
            </span>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-semibold text-zinc-700">
              {scheduleStatusLabels[schedule.status]}
            </span>
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">{schedule.title}</h1>
          <p className="mt-3 text-zinc-600">작성자 {publicMetadata?.leader_nickname ?? "알 수 없음"}</p>

          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            <Detail label="날짜" value={formatHikingDate(schedule.hiking_date)} />
            <Detail
              label="시간"
              value={`${formatHikingTime(schedule.start_time)}${schedule.end_time ? ` – ${formatHikingTime(schedule.end_time)}` : ""}`}
            />
            <Detail label="산" value={schedule.mountain_name} />
            <Detail label="지역" value={schedule.region || "미정"} />
            <Detail label="집결지" value={schedule.meeting_location} />
            <Detail label="난이도" value={difficultyLabels[schedule.difficulty]} />
            <Detail
              label="예상 거리"
              value={schedule.estimated_distance_km === null ? "미정" : `${schedule.estimated_distance_km} km`}
            />
            <Detail
              label="예상 소요시간"
              value={schedule.estimated_duration_minutes === null ? "미정" : `${schedule.estimated_duration_minutes}분`}
            />
            <Detail label="코스" value={schedule.course_description || "미정"} wide />
            <Detail label="준비물" value={schedule.preparation || "별도 안내 없음"} wide />
            <Detail label="이동 방법" value={schedule.transportation || "별도 안내 없음"} wide />
            <Detail label="상세 설명" value={schedule.description || "상세 설명이 없습니다."} wide />
          </dl>

          <section className="mt-8 flex flex-col justify-between gap-5 border-t border-zinc-200 pt-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-bold text-zinc-950">참가 현황</h2>
              <p className="mt-1 text-sm text-zinc-600">
                {schedule.max_participants === null
                  ? `참가 ${joinedCount}명`
                  : `참가 ${joinedCount} / ${schedule.max_participants} · 남은 자리 ${Math.max(schedule.max_participants - joinedCount, 0)}`}
              </p>
            </div>
            <ParticipationButton
              scheduleId={id}
              isAuthenticated={Boolean(user)}
              isLeader={isLeader}
              isJoined={isJoined}
              isFull={isFull}
              scheduleStatus={schedule.status}
            />
          </section>
        </article>

        <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold text-zinc-950">참가자 명단</h2>
          {!user ? (
            <p className="mt-4 text-sm text-zinc-600">참가자 명단은 로그인 후 확인할 수 있습니다.</p>
          ) : (
            <ul className="mt-5 divide-y divide-zinc-100">
              {participants.map((participant) => (
                <li className="flex flex-col justify-between gap-2 py-4 sm:flex-row sm:items-center" key={participant.userId}>
                  <div>
                    <span className="font-semibold text-zinc-900">{participant.nickname}</span>
                    <ParticipantAuthorBadge isAuthor={participant.userId === schedule.leader_id} />
                  </div>
                  <span className="text-sm text-zinc-600">
                    {participant.region || "지역 미설정"} · {hikingLevelLabel(participant.hikingLevel)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function Detail({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`rounded-xl bg-zinc-50 p-4 ${wide ? "sm:col-span-2" : ""}`}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-zinc-900">{value}</dd>
    </div>
  );
}

function hikingLevelLabel(level: string | null) {
  if (level === "beginner") return "초급";
  if (level === "intermediate") return "중급";
  if (level === "advanced") return "고급";
  return "레벨 미설정";
}
