import { z } from "zod";

const emailSchema = z.email("올바른 이메일 주소를 입력해주세요.");
const passwordSchema = z.string().min(8, "비밀번호는 8자 이상이어야 합니다.");
const nicknameSchema = z
  .string()
  .trim()
  .min(2, "닉네임은 2자 이상이어야 합니다.")
  .max(20, "닉네임은 20자 이하여야 합니다.");

export const signupSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    passwordConfirm: z.string(),
    nickname: nicknameSchema,
  })
  .refine((values) => values.password === values.passwordConfirm, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["passwordConfirm"],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

export const profileSchema = z.object({
  nickname: nicknameSchema,
  region: z.string().trim().max(50, "지역은 50자 이하여야 합니다."),
  introduction: z.string().trim().max(500, "자기소개는 500자 이하여야 합니다."),
  hiking_level: z.enum(["beginner", "intermediate", "advanced"]).nullable(),
});

export const resetPasswordSchema = z
  .object({ password: passwordSchema, passwordConfirm: z.string() })
  .refine((values) => values.password === values.passwordConfirm, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["passwordConfirm"],
  });

export type SignupValues = z.infer<typeof signupSchema>;
export type LoginValues = z.infer<typeof loginSchema>;
export type ProfileValues = z.infer<typeof profileSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
