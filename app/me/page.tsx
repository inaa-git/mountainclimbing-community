import Link from "next/link";

import { AccountNav } from "@/components/auth/account-nav";
import { requireUser } from "@/lib/auth/guards";

const hikingLevelLabels = {
  beginner: "초급",
  intermediate: "중급",
  advanced: "고급",
} as const;

export default async function MePage() {
  const { supabase, user } = await requireUser();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("nickname, region, hiking_level, created_at")
    .eq("id", user.id)
    .single();

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-emerald-700">MOUNTAIN COMMUNITY</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-950">내 페이지</h1>
          </div>
          <AccountNav />
        </header>

        {error || !profile ? (
          <section className="rounded-2xl border border-red-200 bg-white p-6">
            <h2 className="font-semibold text-red-700">프로필을 불러오지 못했습니다.</h2>
            <p className="mt-2 text-sm text-zinc-600">Supabase migration 적용 여부를 확인해주세요.</p>
          </section>
        ) : (
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-zinc-500">환영합니다</p>
                <h2 className="mt-1 text-2xl font-bold text-zinc-950">{profile.nickname}</h2>
              </div>
              <Link className="secondary-button" href="/me/profile">
                프로필 수정
              </Link>
            </div>
            <dl className="mt-8 grid gap-5 sm:grid-cols-2">
              <ProfileItem label="이메일" value={user.email ?? "-"} />
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
        )}
      </div>
    </main>
  );
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-zinc-50 p-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-1 break-words text-zinc-900">{value}</dd>
    </div>
  );
}
