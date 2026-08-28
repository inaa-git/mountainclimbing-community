"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { FormMessage } from "@/components/auth/form-message";
import { signupSchema, type SignupValues } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/client";

export function SignupForm() {
  const router = useRouter();
  const [result, setResult] = useState<{ message: string; success: boolean } | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({ resolver: zodResolver(signupSchema) });

  async function onSubmit(values: SignupValues) {
    setResult(null);
    const supabase = createClient();
    const emailRedirectTo = `${window.location.origin}/auth/callback?next=/me`;
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo,
        data: { nickname: values.nickname.trim() },
      },
    });

    if (error) {
      setResult({ message: `회원가입에 실패했습니다: ${error.message}`, success: false });
      return;
    }

    if (data.session) {
      router.replace("/me");
      router.refresh();
      return;
    }

    setResult({
      message: "회원가입이 완료되었습니다. 받은 이메일에서 인증 링크를 확인해주세요.",
      success: true,
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Field label="이메일" error={errors.email?.message}>
        <input className="form-input" type="email" autoComplete="email" {...register("email")} />
      </Field>
      <Field label="비밀번호" error={errors.password?.message}>
        <input
          className="form-input"
          type="password"
          autoComplete="new-password"
          {...register("password")}
        />
      </Field>
      <Field label="비밀번호 확인" error={errors.passwordConfirm?.message}>
        <input
          className="form-input"
          type="password"
          autoComplete="new-password"
          {...register("passwordConfirm")}
        />
      </Field>
      <Field label="닉네임" error={errors.nickname?.message}>
        <input className="form-input" type="text" autoComplete="nickname" {...register("nickname")} />
      </Field>
      {result ? <FormMessage message={result.message} success={result.success} /> : null}
      <button className="primary-button w-full" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "가입 중..." : "회원가입"}
      </button>
      <p className="text-center text-sm text-zinc-600">
        이미 계정이 있나요?{" "}
        <Link className="font-semibold text-zinc-950 underline" href="/login">
          로그인
        </Link>
      </p>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      {children}
      {error ? <span className="block text-sm text-red-600">{error}</span> : null}
    </label>
  );
}
