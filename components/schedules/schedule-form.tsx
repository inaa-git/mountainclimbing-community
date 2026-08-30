"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { createSchedule, updateSchedule } from "@/app/schedules/actions";
import { FormMessage } from "@/components/auth/form-message";
import {
  createScheduleFormSchema,
  type CreateScheduleFormValues,
  type ScheduleFormValues,
} from "@/lib/schedules/validation";

const emptySchedule: ScheduleFormValues = {
  title: "",
  description: "",
  schedule_type: "general",
  hiking_date: "",
  start_time: "08:00",
  end_time: "",
  meeting_location: "",
  region: "",
  mountain_name: "",
  course_description: "",
  difficulty: "medium",
  max_participants: null,
  preparation: "",
  transportation: "",
  estimated_distance_km: null,
  estimated_duration_minutes: null,
  status: "open",
};

export function ScheduleForm({
  mode,
  scheduleId,
  initialValues,
}: {
  mode: "create" | "edit";
  scheduleId?: string;
  initialValues?: ScheduleFormValues;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateScheduleFormValues>({
    resolver: zodResolver(createScheduleFormSchema),
    defaultValues: {
      ...emptySchedule,
      ...initialValues,
      join_as_participant: true,
    },
  });

  function submit(values: CreateScheduleFormValues) {
    setMessage(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createSchedule(values)
          : await updateSchedule(scheduleId ?? "", values);

      if (!result.success || !result.scheduleId) {
        setMessage({ text: result.message, success: false });
        return;
      }

      router.push(`/schedules/${result.scheduleId}`);
      router.refresh();
    });
  }

  const numberValue = { setValueAs: (value: string) => (value === "" ? null : Number(value)) };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(submit)} noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="제목" error={errors.title?.message} wide>
          <input className="form-input" {...register("title")} />
        </Field>
        <Field label="산행 종류" error={errors.schedule_type?.message}>
          <select className="form-input" {...register("schedule_type")}>
            <option value="general">일반 산행</option>
            <option value="theme">테마 산행</option>
            <option value="regular">정기 산행</option>
            <option value="event">이벤트</option>
          </select>
        </Field>
        <Field label="난이도" error={errors.difficulty?.message}>
          <select className="form-input" {...register("difficulty")}>
            <option value="easy">쉬움</option>
            <option value="easy_medium">쉬움-보통</option>
            <option value="medium">보통</option>
            <option value="medium_hard">보통-어려움</option>
            <option value="hard">어려움</option>
          </select>
        </Field>
        <Field label="날짜" error={errors.hiking_date?.message}>
          <input className="form-input" type="date" {...register("hiking_date")} />
        </Field>
        <Field label="시작 시간" error={errors.start_time?.message}>
          <input className="form-input" type="time" {...register("start_time")} />
        </Field>
        <Field label="종료 시간" error={errors.end_time?.message}>
          <input className="form-input" type="time" {...register("end_time")} />
        </Field>
        <Field label="산 이름" error={errors.mountain_name?.message}>
          <input className="form-input" {...register("mountain_name")} />
        </Field>
        <Field label="지역" error={errors.region?.message}>
          <input className="form-input" placeholder="예: 서울" {...register("region")} />
        </Field>
        <Field label="집결지" error={errors.meeting_location?.message} wide>
          <input className="form-input" {...register("meeting_location")} />
        </Field>
        <Field label="예상 거리 (km)" error={errors.estimated_distance_km?.message}>
          <input className="form-input" type="number" min="0" step="0.1" {...register("estimated_distance_km", numberValue)} />
        </Field>
        <Field label="예상 소요시간 (분)" error={errors.estimated_duration_minutes?.message}>
          <input className="form-input" type="number" min="0" {...register("estimated_duration_minutes", numberValue)} />
        </Field>
        <Field label="최대 참가 인원" error={errors.max_participants?.message}>
          <input className="form-input" type="number" min="1" placeholder="제한 없음" {...register("max_participants", numberValue)} />
        </Field>
        {mode === "edit" ? (
          <Field label="모집 상태" error={errors.status?.message}>
            <select className="form-input" {...register("status")}>
              <option value="open">모집 중</option>
              <option value="closed">모집 마감</option>
              <option value="completed">완료</option>
              <option value="cancelled">취소</option>
            </select>
          </Field>
        ) : null}
        <Field label="코스" error={errors.course_description?.message} wide>
          <textarea className="form-input min-h-24 resize-y" {...register("course_description")} />
        </Field>
        <Field label="준비물" error={errors.preparation?.message} wide>
          <textarea className="form-input min-h-20 resize-y" {...register("preparation")} />
        </Field>
        <Field label="이동 방법" error={errors.transportation?.message} wide>
          <textarea className="form-input min-h-20 resize-y" {...register("transportation")} />
        </Field>
        <Field label="상세 설명" error={errors.description?.message} wide>
          <textarea className="form-input min-h-36 resize-y" {...register("description")} />
        </Field>
        {mode === "create" ? (
          <label className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 sm:col-span-2">
            <input
              className="size-5 accent-emerald-700"
              type="checkbox"
              {...register("join_as_participant")}
            />
            <span className="text-sm font-semibold text-emerald-950">이 산행에 나도 참가합니다</span>
          </label>
        ) : null}
      </div>
      {message ? <FormMessage message={message.text} success={message.success} /> : null}
      <button className="primary-button w-full sm:w-auto" disabled={isPending} type="submit">
        {isPending ? "저장 중..." : mode === "create" ? "일정 등록" : "변경사항 저장"}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  wide = false,
  children,
}: {
  label: string;
  error?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`block space-y-2 ${wide ? "sm:col-span-2" : ""}`}>
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      {children}
      {error ? <span className="block text-sm text-red-600">{error}</span> : null}
    </label>
  );
}
