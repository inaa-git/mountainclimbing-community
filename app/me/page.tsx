import type { SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";

import { AccountNav } from "@/components/auth/account-nav";
import { ScheduleCard } from "@/components/schedules/schedule-card";
import { requireUser } from "@/lib/auth/guards";
import {
  classifyScheduleActivities,
  getKoreanDateKey,
  type Participation,
  type Schedule,
  type ScheduleActivity,
} from "@/lib/schedules/activity";
import type { Database } from "@/lib/supabase/database.types";

type PublicMetadata = Database["public"]["Functions"]["get_schedule_public_metadata"]["Returns"][number];

const hikingLevelLabels = {
  beginner: "초급",
  intermediate: "중급",
  advanced: "고급",
} as const;

export default async function MePage() {
  const { supabase, user } = await requireUser();
  const today = getKoreanDateKey(new Date());
  const [profileSettled, activitySettled] = await Promise.allSettled([
    supabase
      .from("profiles")
      .select("nickname, region, hiking_level, created_at")
      .eq("id", user.id)
      .single(),
    loadActivityData(supabase, user.id, today),
  ]);
  const profileResult = profileSettled.status === "fulfilled" ? profileSettled.value : null;
  const profile = profileResult?.error ? null : (profileResult?.data ?? null);
  const activity =
    activitySettled.status === "fulfilled" ? activitySettled.value : getFailedActivityData();

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-emerald-700">MOUNTAIN COMMUNITY</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-950">내 활동</h1>
          </div>
          <AccountNav />
        </header>

        {profile ? (
          <ProfileSummary profile={profile} email={user.email ?? "-"} />
        ) : (
          <section className="rounded-2xl border border-red-200 bg-white p-6">
            <h2 className="font-semibold text-red-700">프로필을 불러오지 못했습니다.</h2>
            <p className="mt-2 text-sm text-zinc-600">잠시 후 다시 시도해주세요.</p>
          </section>
        )}

        <section className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="활동 요약">
          <SummaryItem label="내가 만든 산행" value={activity.createdError ? null : activity.ledSchedules.length} />
          <SummaryItem label="현재 참가 중" value={activity.joinedError ? null : activity.joinedSchedules.length} />
          <SummaryItem label="지난 활동" value={activity.pastError ? null : activity.pastActivities.length} />
        </section>

        <div className="mt-12 space-y-14">
          <ActivitySection
            title="내가 만든 산행"
            description="직접 만든 산행 일정입니다. 예정된 일정부터 확인할 수 있어요."
            items={activity.ledSchedules.map((schedule) => ({ schedule }))}
            metadata={activity.metadata}
            failed={activity.createdError}
            emptyMessage="아직 만든 산행 일정이 없습니다."
            emptyAction={{ href: "/schedules/new", label: "새 일정 등록" }}
          />
          <ActivitySection
            title="참가 중인 산행"
            description="작성자 여부와 관계없이 실제 참가 중인 앞으로의 일정입니다."
            items={activity.joinedSchedules}
            metadata={activity.metadata}
            failed={activity.joinedError}
            emptyMessage="현재 참가 중인 산행이 없습니다."
            emptyAction={{ href: "/schedules", label: "산행 일정 보기" }}
          />
          <ActivitySection
            title="지난 활동"
            description="실제로 참가한 지난 산행과 완료된 일정입니다."
            items={activity.pastActivities}
            metadata={activity.metadata}
            failed={activity.pastError}
            emptyMessage="아직 지난 산행 활동이 없습니다."
          />
        </div>
      </div>
    </main>
  );
}

async function loadActivityData(
  supabase: SupabaseClient<Database>,
  userId: string,
  today: string,
) {
  const [leaderResult, participationResult, metadataResult] = await Promise.all([
    supabase.from("schedules").select("*").eq("leader_id", userId),
    supabase
      .from("schedule_participants")
      .select("schedule_id, status, joined_at, cancelled_at")
      .eq("user_id", userId),
    supabase.rpc("get_schedule_public_metadata"),
  ]);

  const participations = participationResult.error
    ? []
    : ((participationResult.data ?? []) satisfies Participation[]);
  let participantSchedules: Schedule[] = [];
  let participantSchedulesFailed = false;

  if (participations.length > 0) {
    const scheduleResult = await supabase
      .from("schedules")
      .select("*")
      .in("id", participations.map((participation) => participation.schedule_id));
    participantSchedulesFailed = Boolean(scheduleResult.error);
    participantSchedules = scheduleResult.error ? [] : (scheduleResult.data ?? []);
  }

  const classified = classifyScheduleActivities({
    today,
    ledSchedules: leaderResult.error ? [] : (leaderResult.data ?? []),
    participations,
    participantSchedules,
  });
  const metadataFailed = Boolean(metadataResult.error);

  return {
    ...classified,
    metadata: new Map(
      metadataResult.error
        ? []
        : (metadataResult.data ?? []).map((item) => [item.schedule_id, item] as const),
    ),
    createdError: Boolean(leaderResult.error) || metadataFailed,
    joinedError: Boolean(participationResult.error) || participantSchedulesFailed || metadataFailed,
    pastError: Boolean(participationResult.error) || participantSchedulesFailed || metadataFailed,
  };
}

function getFailedActivityData() {
  return {
    ledSchedules: [] as Schedule[],
    joinedSchedules: [] as ScheduleActivity[],
    pastActivities: [] as ScheduleActivity[],
    metadata: new Map<string, PublicMetadata>(),
    createdError: true,
    joinedError: true,
    pastError: true,
  };
}

function ProfileSummary({
  profile,
  email,
}: {
  profile: {
    nickname: string;
    region: string | null;
    hiking_level: keyof typeof hikingLevelLabels | null;
    created_at: string;
  };
  email: string;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-zinc-500">환영합니다</p>
          <h2 className="mt-1 text-2xl font-bold text-zinc-950">{profile.nickname}</h2>
        </div>
        <Link className="secondary-button" href="/me/profile">
          프로필 수정
        </Link>
      </div>
      <dl className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <ProfileItem label="이메일" value={email} />
        <ProfileItem label="지역" value={profile.region || "미설정"} />
        <ProfileItem
          label="등산 레벨"
          value={profile.hiking_level ? hikingLevelLabels[profile.hiking_level] : "미설정"}
        />
        <ProfileItem
          label="가입일"
          value={new Intl.DateTimeFormat("ko-KR", { dateStyle: "long" }).format(
            new Date(profile.created_at),
          )}
        />
      </dl>
    </section>
  );
}

function SummaryItem({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-zinc-600">{label}</p>
      <p className="mt-2 text-3xl font-black text-emerald-800">{value ?? "-"}</p>
    </div>
  );
}

function ActivitySection({
  title,
  description,
  items,
  metadata,
  failed,
  emptyMessage,
  emptyAction,
}: {
  title: string;
  description: string;
  items: Array<{ schedule: Schedule; participantStatus?: ScheduleActivity["participantStatus"] }>;
  metadata: Map<string, PublicMetadata>;
  failed: boolean;
  emptyMessage: string;
  emptyAction?: { href: string; label: string };
}) {
  return (
    <section aria-labelledby={`${title}-heading`}>
      <div>
        <h2 id={`${title}-heading`} className="text-2xl font-black tracking-tight text-zinc-950">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
      </div>

      {failed ? (
        <ActivityMessage message="활동 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요." />
      ) : items.length > 0 ? (
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map(({ schedule }) => {
            const item = metadata.get(schedule.id);
            return (
              <div key={schedule.id} className="min-w-0">
                <ScheduleCard
                  schedule={schedule}
                  leaderNickname={item?.leader_nickname ?? "알 수 없음"}
                  joinedCount={Number(item?.joined_count ?? 0)}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <ActivityMessage message={emptyMessage} action={emptyAction} />
      )}
    </section>
  );
}

function ActivityMessage({
  message,
  action,
}: {
  message: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-white px-5 py-8 text-center">
      <p className="text-sm text-zinc-600">{message}</p>
      {action ? (
        <Link className="secondary-button mt-4" href={action.href}>
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-zinc-50 p-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-1 break-words text-zinc-900">{value}</dd>
    </div>
  );
}
