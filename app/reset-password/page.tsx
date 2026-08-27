import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { requireUser } from "@/lib/auth/guards";

export default async function ResetPasswordPage() {
  await requireUser();
  return (
    <AuthShell title="새 비밀번호 설정" description="앞으로 사용할 새 비밀번호를 입력해주세요.">
      <ResetPasswordForm />
    </AuthShell>
  );
}
