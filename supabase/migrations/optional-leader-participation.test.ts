import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260830010000_optional_leader_participation.sql",
  ),
  "utf8",
).toLowerCase();

describe("optional leader participation migration contract", () => {
  it("makes authenticated schedule creation RPC-only", () => {
    expect(sql).toContain("revoke insert on table public.schedules from anon, authenticated");
    expect(sql).toContain(
      "revoke execute on function public.create_schedule(jsonb, boolean) from public, anon, authenticated",
    );
    expect(sql).toContain(
      "grant execute on function public.create_schedule(jsonb, boolean) to authenticated",
    );
  });

  it("uses auth.uid and database defaults instead of client-controlled identity fields", () => {
    expect(sql).toContain("current_user_id uuid := auth.uid()");
    expect(sql).toContain("current_user_id,");
    expect(sql).not.toContain("schedule_data ->> 'leader_id'");
    expect(sql).not.toContain("schedule_data ->> 'id'");
    expect(sql).not.toContain("schedule_data ->> 'created_at'");
    expect(sql).not.toContain("schedule_data ->> 'updated_at'");
  });

  it("forces every newly created schedule to open status", () => {
    expect(sql).not.toContain("schedule_data ->> 'status'");
    expect(sql).toMatch(/estimated_duration_minutes,\s+status\s+\)[\s\S]*?'open'\s+\)/);
  });

  it("keeps security definer and an empty search path on create_schedule", () => {
    const createFunction = sql.slice(
      sql.indexOf("create or replace function public.create_schedule"),
      sql.indexOf("create or replace function public.join_schedule"),
    );
    expect(createFunction).toContain("security definer");
    expect(createFunction).toContain("set search_path = ''");
  });
});
