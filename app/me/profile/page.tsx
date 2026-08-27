import Link from "next/link";

import { ProfileForm } from "@/components/profile/profile-form";
import { requireUser } from "@/lib/auth/guards";

export default async function ProfilePage() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname, region, introduction, hiking_level")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <p className="rounded-xl bg-red-50 p-4 text-red-700">프로필을 찾을 수 없습니다.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:py-12">
      <section className="mx-auto max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <Link className="text-sm font-semibold text-zinc-600" href="/me">
          ← 내 페이지
        </Link>
        <h1 className="mt-6 text-2xl font-bold text-zinc-950">프로필 수정</h1>
        <p className="mt-2 mb-7 text-sm text-zinc-600">공개 프로필에 표시할 정보를 관리하세요.</p>
        <ProfileForm userId={user.id} profile={profile} />
      </section>
    </main>
  );
}
