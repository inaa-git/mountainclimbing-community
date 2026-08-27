"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { FormMessage } from "@/components/auth/form-message";
import { profileSchema, type ProfileValues } from "@/lib/auth/validation";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/client";

type Profile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "nickname" | "region" | "introduction" | "hiking_level"
>;

export function ProfileForm({ userId, profile }: { userId: string; profile: Profile }) {
  const [result, setResult] = useState<{ message: string; success: boolean } | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nickname: profile.nickname,
      region: profile.region ?? "",
      introduction: profile.introduction ?? "",
      hiking_level: profile.hiking_level,
    },
  });

  async function onSubmit(values: ProfileValues) {
    setResult(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        nickname: values.nickname.trim(),
        region: values.region || null,
        introduction: values.introduction || null,
        hiking_level: values.hiking_level,
      })
      .eq("id", userId);

    if (error?.code === "23505") {
      setResult({ message: "이미 사용 중인 닉네임입니다.", success: false });
      return;
    }
    if (error) {
      setResult({ message: "프로필을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.", success: false });
      return;
    }

    setResult({ message: "프로필을 저장했습니다.", success: true });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
      <label className="block space-y-2">
        <span className="text-sm font-medium">닉네임</span>
        <input className="form-input" {...register("nickname")} />
        {errors.nickname ? <span className="block text-sm text-red-600">{errors.nickname.message}</span> : null}
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">지역</span>
        <input className="form-input" placeholder="예: 서울" {...register("region")} />
        {errors.region ? <span className="block text-sm text-red-600">{errors.region.message}</span> : null}
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">등산 레벨</span>
        <select
          className="form-input"
          {...register("hiking_level", { setValueAs: (value) => (value === "" ? null : value) })}
        >
          <option value="">선택 안 함</option>
          <option value="beginner">초급</option>
          <option value="intermediate">중급</option>
          <option value="advanced">고급</option>
        </select>
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">자기소개</span>
        <textarea className="form-input min-h-32 resize-y" {...register("introduction")} />
        {errors.introduction ? (
          <span className="block text-sm text-red-600">{errors.introduction.message}</span>
        ) : null}
      </label>
      {result ? <FormMessage message={result.message} success={result.success} /> : null}
      <button className="primary-button w-full sm:w-auto" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "저장 중..." : "변경사항 저장"}
      </button>
    </form>
  );
}
