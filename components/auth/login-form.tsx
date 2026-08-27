"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { FormMessage } from "@/components/auth/form-message";
import { loginSchema, type LoginValues } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginValues) {
    setErrorMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(values);

    if (error) {
      setErrorMessage("이메일 또는 비밀번호를 확인해주세요.");
      return;
    }

    router.push("/me");
    router.refresh();
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-zinc-800">이메일</span>
        <input className="form-input" type="email" autoComplete="email" {...register("email")} />
        {errors.email ? <span className="block text-sm text-red-600">{errors.email.message}</span> : null}
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-zinc-800">비밀번호</span>
        <input
          className="form-input"
          type="password"
          autoComplete="current-password"
          {...register("password")}
        />
        {errors.password ? (
          <span className="block text-sm text-red-600">{errors.password.message}</span>
        ) : null}
      </label>
      {errorMessage ? <FormMessage message={errorMessage} /> : null}
      <button className="primary-button w-full" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "로그인 중..." : "로그인"}
      </button>
      <div className="flex flex-wrap justify-between gap-3 text-sm">
        <Link className="text-zinc-700 underline" href="/forgot-password">
          비밀번호 재설정
        </Link>
        <Link className="font-semibold text-zinc-950 underline" href="/signup">
          회원가입
        </Link>
      </div>
    </form>
  );
}
