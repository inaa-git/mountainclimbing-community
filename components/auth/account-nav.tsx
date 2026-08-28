import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";

export function AccountNav() {
  return (
    <nav aria-label="회원 메뉴" className="flex flex-wrap items-center gap-4">
      <Link className="text-sm font-medium text-zinc-700 hover:text-zinc-950" href="/schedules">
        산행 일정
      </Link>
      <Link className="text-sm font-medium text-zinc-700 hover:text-zinc-950" href="/me">
        내 활동
      </Link>
      <Link className="text-sm font-medium text-zinc-700 hover:text-zinc-950" href="/me/profile">
        프로필
      </Link>
      <LogoutButton />
    </nav>
  );
}
