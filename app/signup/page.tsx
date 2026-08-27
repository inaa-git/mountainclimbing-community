import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { createClient } from "@/lib/supabase/server";

export default async function SignupPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/me");

  return (
    <AuthShell title="회원가입" description="이메일과 닉네임으로 등산 커뮤니티 계정을 만드세요.">
      <SignupForm />
    </AuthShell>
  );
}
