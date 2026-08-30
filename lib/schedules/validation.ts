import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).or(z.literal(""));
const nullableNumber = (schema: z.ZodNumber) => schema.nullable();

export const scheduleFormSchema = z
  .object({
    title: z.string().trim().min(2, "제목은 2자 이상이어야 합니다.").max(100),
    description: optionalText(2000),
    schedule_type: z.enum(["general", "theme", "regular", "event"]),
    hiking_date: z.iso.date("올바른 날짜를 선택해주세요."),
    start_time: z.string().regex(/^\d{2}:\d{2}$/, "시작 시간을 선택해주세요."),
    end_time: z.string().regex(/^\d{2}:\d{2}$/).or(z.literal("")),
    meeting_location: z.string().trim().min(1, "집결지를 입력해주세요.").max(200),
    region: optionalText(50),
    mountain_name: z.string().trim().min(1, "산 이름을 입력해주세요.").max(100),
    course_description: optionalText(1000),
    difficulty: z.enum(["easy", "easy_medium", "medium", "medium_hard", "hard"]),
    max_participants: nullableNumber(z.number().int().min(1, "정원은 1명 이상이어야 합니다.")),
    preparation: optionalText(1000),
    transportation: optionalText(500),
    estimated_distance_km: nullableNumber(z.number().min(0, "거리는 0 이상이어야 합니다.")),
    estimated_duration_minutes: nullableNumber(
      z.number().int().min(0, "예상 시간은 0 이상이어야 합니다."),
    ),
    status: z.enum(["open", "closed", "completed", "cancelled"]),
  })
  .refine((value) => !value.end_time || value.end_time > value.start_time, {
    path: ["end_time"],
    message: "종료 시간은 시작 시간보다 늦어야 합니다.",
  });

export type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

export const createScheduleFormSchema = scheduleFormSchema.and(
  z.object({ join_as_participant: z.boolean() }),
);

export type CreateScheduleFormValues = z.infer<typeof createScheduleFormSchema>;
