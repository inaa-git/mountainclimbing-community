"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function logout() {
    setIsPending(true);
    setErrorMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      setErrorMessage("로그아웃하지 못했습니다. 다시 시도해주세요.");
      setIsPending(false);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        className="text-sm font-medium text-zinc-700 hover:text-zinc-950"
        onClick={logout}
        disabled={isPending}
      >
        {isPending ? "로그아웃 중..." : "로그아웃"}
      </button>
      {errorMessage ? (
        <span role="alert" className="text-xs text-red-600">
          {errorMessage}
        </span>
      ) : null}
    </div>
  );
}
