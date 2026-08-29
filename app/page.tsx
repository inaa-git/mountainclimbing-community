import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { AccountNav } from "@/components/auth/account-nav";
import { ScheduleCard } from "@/components/schedules/schedule-card";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type Schedule = Database["public"]["Tables"]["schedules"]["Row"];
type PublicMetadata = Database["public"]["Functions"]["get_schedule_public_metadata"]["Returns"][number];

export const metadata: Metadata = {
  title: "Mountain Community",
  description: "함께 산을 오르고 새로운 사람을 만나는 등산 커뮤니티",
};

export default async function Home() {
  const { isAuthenticated, schedules, metadata, scheduleLoadFailed } = await loadHomeData();

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Link className="flex items-center gap-3" href="/" aria-label="Mountain Community 홈">
            <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-800 text-sm font-black text-white">
              MC
            </span>
            <span className="text-sm font-black tracking-[0.16em] text-zinc-950 sm:text-base">
              MOUNTAIN COMMUNITY
            </span>
          </Link>

          {isAuthenticated ? (
            <AccountNav />
          ) : (
            <nav aria-label="주요 메뉴" className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <NavLink href="/schedules">산행 일정</NavLink>
              <NavLink href="/login">로그인</NavLink>
              <Link className="secondary-button" href="/signup">
                회원가입
              </Link>
            </nav>
          )}
        </div>
      </header>

      <section className="px-4 py-8 sm:px-6 sm:py-12">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl px-6 py-12 text-white shadow-sm sm:px-10 sm:py-16 lg:px-16 lg:py-20">
          <Image
            src="/images/home-hero.webp"
            alt=""
            fill
            priority
            sizes="(max-width: 640px) calc(100vw - 2rem), (max-width: 1200px) calc(100vw - 3rem), 1152px"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative max-w-3xl">
            <p className="text-sm font-bold tracking-[0.2em] text-emerald-200">TOGETHER ON THE TRAIL</p>
            <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              함께 오르고,
              <br />
              산에서 더 가까워집니다.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-emerald-50/85 sm:text-lg sm:leading-8">
              지역과 난이도에 맞는 산행을 찾고 새로운 동료와 안전하게 출발하세요. 누구나 일정을 만들고,
              함께 걸을 사람을 만날 수 있습니다.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className="inline-flex min-h-12 items-center justify-center rounded-lg bg-white px-6 py-3 font-bold text-emerald-950 transition hover:bg-emerald-50" href="/schedules">
                산행 일정 보기
              </Link>
              <Link className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/30 px-6 py-3 font-bold text-white transition hover:bg-white/10" href="/schedules/new">
                새 일정 등록
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 sm:py-12" aria-labelledby="upcoming-heading">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold tracking-[0.16em] text-emerald-700">UPCOMING HIKES</p>
              <h2 id="upcoming-heading" className="mt-2 text-3xl font-black tracking-tight text-zinc-950">
                가까운 예정 산행
              </h2>
              <p className="mt-2 text-zinc-600">지금 참가할 수 있는 가까운 산행을 확인해보세요.</p>
            </div>
            <Link className="text-sm font-bold text-emerald-800 hover:text-emerald-950" href="/schedules">
              전체 일정 보기 →
            </Link>
          </div>

          {schedules.length > 0 ? (
            <div className="mt-7 grid gap-5 lg:grid-cols-3">
              {schedules.map((schedule) => {
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
            </div>
          ) : (
            <HomeScheduleFallback failed={scheduleLoadFailed} />
          )}
        </div>
      </section>

      <section className="px-4 pb-16 pt-6 sm:px-6 sm:pb-24" aria-labelledby="community-heading">
        <div className="mx-auto max-w-6xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="max-w-2xl">
            <p className="text-sm font-bold tracking-[0.16em] text-emerald-700">OUR COMMUNITY</p>
            <h2 id="community-heading" className="mt-2 text-3xl font-black tracking-tight">
              산을 좋아하는 누구나 함께할 수 있어요.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Feature number="01" title="나에게 맞는 산행" description="지역과 난이도를 살펴보고 부담 없이 참가할 일정을 선택하세요." />
            <Feature number="02" title="신뢰할 수 있는 동료" description="프로필과 참가자 명단을 확인하고 함께 걸을 사람을 만나보세요." />
            <Feature number="03" title="직접 만드는 일정" description="가고 싶은 산과 코스를 정해 새로운 산행을 직접 열어보세요." />
          </div>
        </div>
      </section>
    </main>
  );
}

async function loadHomeData() {
  let isAuthenticated = false;
  let schedules: Schedule[] = [];
  let metadata = new Map<string, PublicMetadata>();
  let scheduleLoadFailed = false;

  try {
    const supabase = await createClient();
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
    const [authResult, scheduleResult, metadataResult] = await Promise.allSettled([
      supabase.auth.getUser(),
      supabase
        .from("schedules")
        .select("*")
        .gte("hiking_date", today)
        .in("status", ["open", "closed"])
        .order("hiking_date", { ascending: true })
        .limit(3),
      supabase.rpc("get_schedule_public_metadata"),
    ]);

    if (authResult.status === "fulfilled" && !authResult.value.error) {
      isAuthenticated = Boolean(authResult.value.data.user);
    }

    if (scheduleResult.status === "fulfilled" && !scheduleResult.value.error) {
      schedules = scheduleResult.value.data ?? [];
    } else {
      scheduleLoadFailed = true;
    }

    if (metadataResult.status === "fulfilled" && !metadataResult.value.error) {
      metadata = new Map((metadataResult.value.data ?? []).map((item) => [item.schedule_id, item]));
    }
  } catch {
    scheduleLoadFailed = true;
  }

  return { isAuthenticated, schedules, metadata, scheduleLoadFailed };
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link className="text-sm font-semibold text-zinc-700 transition hover:text-emerald-800" href={href}>
      {children}
    </Link>
  );
}

function HomeScheduleFallback({ failed }: { failed: boolean }) {
  return (
    <div className="mt-7 rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
      <p className="font-bold text-zinc-900">
        {failed ? "예정 산행을 불러오지 못했습니다." : "아직 등록된 예정 산행이 없습니다."}
      </p>
      <p className="mt-2 text-sm text-zinc-600">
        {failed ? "잠시 후 일정 목록에서 다시 확인해주세요." : "첫 번째 산행 일정을 만들어보세요."}
      </p>
      <Link className="secondary-button mt-5" href={failed ? "/schedules" : "/schedules/new"}>
        {failed ? "일정 목록으로 이동" : "새 일정 등록"}
      </Link>
    </div>
  );
}

function Feature({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <article className="rounded-2xl bg-zinc-50 p-5 sm:p-6">
      <span className="text-sm font-black text-emerald-700">{number}</span>
      <h3 className="mt-4 text-lg font-bold text-zinc-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
    </article>
  );
}
