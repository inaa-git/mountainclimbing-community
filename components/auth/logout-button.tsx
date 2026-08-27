"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function logout() {
    setIsPending(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button className="text-sm font-medium text-zinc-700 hover:text-zinc-950" onClick={logout} disabled={isPending}>
      {isPending ? "로그아웃 중..." : "로그아웃"}
    </button>
  );
}
