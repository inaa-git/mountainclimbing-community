import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/me");

  return (
    <AuthShell title="로그인" description="계정에 로그인해 내 프로필을 관리하세요.">
      <LoginForm />
    </AuthShell>
  );
}
