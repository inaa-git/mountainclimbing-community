import { describe, expect, it } from "vitest";

import { loginSchema, profileSchema, signupSchema } from "@/lib/auth/validation";

describe("signupSchema", () => {
  it("accepts a valid signup", () => {
    expect(
      signupSchema.safeParse({
        email: "hiker@example.com",
        password: "password123",
        passwordConfirm: "password123",
        nickname: "산사람",
      }).success,
    ).toBe(true);
  });

  it("rejects invalid email, short passwords, mismatches, and short nicknames", () => {
    const result = signupSchema.safeParse({
      email: "invalid",
      password: "short",
      passwordConfirm: "different",
      nickname: "산",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((issue) => issue.path[0]);
      expect(fields).toEqual(expect.arrayContaining(["email", "password", "passwordConfirm", "nickname"]));
    }
  });
});

describe("loginSchema", () => {
  it("validates login input", () => {
    expect(loginSchema.safeParse({ email: "hiker@example.com", password: "secret" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "wrong", password: "" }).success).toBe(false);
  });
});

describe("profileSchema", () => {
  it("accepts a valid profile update", () => {
    expect(
      profileSchema.safeParse({
        nickname: "산사람",
        region: "서울",
        introduction: "주말 산행을 좋아합니다.",
        hiking_level: "intermediate",
      }).success,
    ).toBe(true);
  });

  it("rejects invalid nickname and hiking level", () => {
    expect(
      profileSchema.safeParse({ nickname: "", region: "", introduction: "", hiking_level: "expert" }).success,
    ).toBe(false);
  });
});
