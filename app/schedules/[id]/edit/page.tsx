import Link from "next/link";

import { ScheduleForm } from "@/components/schedules/schedule-form";
import { requireScheduleLeader } from "@/lib/schedules/guards";

export default async function EditSchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { schedule } = await requireScheduleLeader(id);

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:py-12">
      <section className="mx-auto max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <Link className="text-sm font-semibold text-zinc-600" href={`/schedules/${id}`}>← 일정 상세</Link>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-zinc-950">산행 일정 수정</h1>
        <p className="mt-2 mb-8 text-zinc-600">작성자만 일정 정보를 변경할 수 있습니다.</p>
        <ScheduleForm
          mode="edit"
          scheduleId={id}
          initialValues={{
            title: schedule.title,
            description: schedule.description ?? "",
            schedule_type: schedule.schedule_type,
            hiking_date: schedule.hiking_date,
            start_time: schedule.start_time.slice(0, 5),
            end_time: schedule.end_time?.slice(0, 5) ?? "",
            meeting_location: schedule.meeting_location,
            region: schedule.region ?? "",
            mountain_name: schedule.mountain_name,
            course_description: schedule.course_description ?? "",
            difficulty: schedule.difficulty,
            max_participants: schedule.max_participants,
            preparation: schedule.preparation ?? "",
            transportation: schedule.transportation ?? "",
            estimated_distance_km: schedule.estimated_distance_km,
            estimated_duration_minutes: schedule.estimated_duration_minutes,
            status: schedule.status,
          }}
        />
      </section>
    </main>
  );
}
