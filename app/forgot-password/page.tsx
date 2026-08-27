import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="비밀번호 재설정" description="가입한 이메일로 비밀번호 재설정 링크를 보내드립니다.">
      <ForgotPasswordForm />
    </AuthShell>
  );
}
