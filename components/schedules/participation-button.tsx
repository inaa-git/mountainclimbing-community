"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { cancelScheduleParticipation, joinSchedule } from "@/app/schedules/actions";
import { FormMessage } from "@/components/auth/form-message";

export function ParticipationButton({
  scheduleId,
  isAuthenticated,
  isLeader,
  isJoined,
  isFull,
  scheduleStatus,
}: {
  scheduleId: string;
  isAuthenticated: boolean;
  isLeader: boolean;
  isJoined: boolean;
  isFull: boolean;
  scheduleStatus: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

  if (isLeader) return <span className="rounded-full bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-800">리더</span>;
  if (!isAuthenticated) return <Link className="primary-button" href="/login">로그인하고 참가하기</Link>;
  if (scheduleStatus === "cancelled") return <span className="font-semibold text-red-700">취소된 산행</span>;
  if (scheduleStatus !== "open" && !isJoined) return <span className="font-semibold text-zinc-600">모집 마감</span>;
  if (isFull && !isJoined) return <span className="font-semibold text-zinc-600">모집 마감</span>;

  function mutate() {
    startTransition(async () => {
      const result = isJoined
        ? await cancelScheduleParticipation(scheduleId)
        : await joinSchedule(scheduleId);
      setMessage({ text: result.message, success: result.success });
    });
  }

  return (
    <div className="space-y-3">
      <button className={isJoined ? "secondary-button" : "primary-button"} onClick={mutate} disabled={isPending}>
        {isPending ? "처리 중..." : isJoined ? "참가 취소" : "참가 신청"}
      </button>
      {message ? <FormMessage message={message.text} success={message.success} /> : null}
    </div>
  );
}
