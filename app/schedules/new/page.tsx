import Link from "next/link";

import { ScheduleForm } from "@/components/schedules/schedule-form";
import { requireUser } from "@/lib/auth/guards";

export default async function NewSchedulePage() {
  await requireUser();
  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:py-12">
      <section className="mx-auto max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <Link className="text-sm font-semibold text-zinc-600" href="/schedules">← 일정 목록</Link>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-zinc-950">산행 일정 등록</h1>
        <p className="mt-2 mb-8 text-zinc-600">산행 정보와 참가 조건을 입력해주세요.</p>
        <ScheduleForm mode="create" />
      </section>
    </main>
  );
}
