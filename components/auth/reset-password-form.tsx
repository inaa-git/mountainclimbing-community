"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { FormMessage } from "@/components/auth/form-message";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema) });

  async function onSubmit(values: ResetPasswordValues) {
    setErrorMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      setErrorMessage("비밀번호를 변경하지 못했습니다. 재설정 링크를 다시 요청해주세요.");
      return;
    }
    router.replace("/me");
    router.refresh();
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <label className="block space-y-2">
        <span className="text-sm font-medium">새 비밀번호</span>
        <input className="form-input" type="password" {...register("password")} />
        {errors.password ? <span className="text-sm text-red-600">{errors.password.message}</span> : null}
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">새 비밀번호 확인</span>
        <input className="form-input" type="password" {...register("passwordConfirm")} />
        {errors.passwordConfirm ? (
          <span className="text-sm text-red-600">{errors.passwordConfirm.message}</span>
        ) : null}
      </label>
      {errorMessage ? <FormMessage message={errorMessage} /> : null}
      <button className="primary-button w-full" disabled={isSubmitting}>
        비밀번호 변경
      </button>
    </form>
  );
}
