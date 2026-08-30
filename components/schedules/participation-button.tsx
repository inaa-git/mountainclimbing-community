"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);
  const leaderStatus = isLeader ? (
    <span className="rounded-full bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-800">
      작성자 · {isJoined ? "참가 중" : "미참가"}
    </span>
  ) : null;

  if (scheduleStatus === "cancelled") {
    return <ParticipationState leaderStatus={leaderStatus} label="취소된 산행" tone="text-red-700" />;
  }
  if (scheduleStatus === "completed") {
    return <ParticipationState leaderStatus={leaderStatus} label="완료된 산행" />;
  }
  if (!isAuthenticated) return <Link className="primary-button" href="/login">로그인하고 참가하기</Link>;
  if ((scheduleStatus !== "open" || isFull) && !isJoined) {
    return <ParticipationState leaderStatus={leaderStatus} label="모집 마감" />;
  }

  function mutate() {
    startTransition(async () => {
      const result = isJoined
        ? await cancelScheduleParticipation(scheduleId)
        : await joinSchedule(scheduleId);
      setMessage({ text: result.message, success: result.success });
      if (result.success) router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {leaderStatus}
      <button className={isJoined ? "secondary-button" : "primary-button"} onClick={mutate} disabled={isPending}>
        {isPending ? "처리 중..." : isJoined ? "참가 취소" : "참가 신청"}
      </button>
      {message ? <FormMessage message={message.text} success={message.success} /> : null}
    </div>
  );
}

function ParticipationState({
  leaderStatus,
  label,
  tone = "text-zinc-600",
}: {
  leaderStatus: React.ReactNode;
  label: string;
  tone?: string;
}) {
  return (
    <div className="flex flex-col items-start gap-3 sm:items-end">
      {leaderStatus}
      <span className={`font-semibold ${tone}`}>{label}</span>
    </div>
  );
}
