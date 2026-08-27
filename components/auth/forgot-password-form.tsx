"use client";

import { useState } from "react";

import { FormMessage } from "@/components/auth/form-message";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<{ message: string; success: boolean } | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setResult(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setIsPending(false);

    setResult(
      error
        ? { message: "재설정 이메일을 보내지 못했습니다.", success: false }
        : { message: "계정이 존재하면 비밀번호 재설정 이메일을 보내드립니다.", success: true },
    );
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <label className="block space-y-2">
        <span className="text-sm font-medium">이메일</span>
        <input
          className="form-input"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      {result ? <FormMessage message={result.message} success={result.success} /> : null}
      <button className="primary-button w-full" disabled={isPending}>
        {isPending ? "전송 중..." : "재설정 이메일 보내기"}
      </button>
    </form>
  );
}
