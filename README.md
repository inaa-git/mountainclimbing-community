This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Supabase Setup

This project uses [Supabase](https://supabase.com) for auth and data, via
`@supabase/supabase-js` and `@supabase/ssr`.

1. Create a project at [supabase.com](https://supabase.com/dashboard).
2. In the Supabase dashboard, go to **Project Settings > API** and copy the
   **Project URL** and **anon public** key.
3. Copy `.env.example` to `.env.local` and fill in the values:

   ```bash
   cp .env.example .env.local
   ```

   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. `.env.local` is git-ignored and must never be committed. The
   **service_role** key (`SUPABASE_SERVICE_ROLE_KEY`) is server-only, bypasses
   Row Level Security, and must never be prefixed with `NEXT_PUBLIC_` or used
   in client-side code.

### Client structure

- `lib/supabase/client.ts` — browser client (Client Components).
- `lib/supabase/server.ts` — server client for Server Components and
  Route Handlers, backed by Next.js cookies.
- `lib/supabase/middleware.ts` + `proxy.ts` — refreshes the
  Supabase auth session on every request.

### Implemented member system

- Email sign-up with optional email confirmation
- Email/password login and logout
- Server-side protection for `/me` and `/me/profile`
- Profile lookup and editing
- `public.profiles` table linked to `auth.users`
- Automatic profile creation after sign-up
- Supabase Auth session refresh through `proxy.ts`
- Row Level Security for authenticated profile reads and owner-only updates

## Schedule integration checklist

Apply all Supabase migrations in this exact order:

1. `supabase/migrations/20260827010000_create_profiles.sql`
2. `supabase/migrations/20260829010000_create_schedules.sql`
3. `supabase/migrations/20260829020000_harden_schedule_integrity.sql`
4. `supabase/migrations/20260830010000_optional_leader_participation.sql`

The hardening migration enforces the form's string lengths and same-day time
ordering in PostgreSQL. Overnight hikes are not supported in this MVP; replace
`schedules_time_order_check` in a future migration before adding them.

### Verified integration status

The following checks have been completed against the live Supabase project and
the browser UI:

- `20260830010000_optional_leader_participation.sql` applied successfully
- `create_schedule(jsonb, boolean)` exists
- The previous automatic-participation trigger and function were removed
- Direct `schedules` INSERT permission was removed from `authenticated`
- `authenticated` can execute `create_schedule`; `anon` cannot
- Creating with the participation checkbox selected creates a joined creator row
- Creating with the checkbox cleared leaves the creator without a participant row
- The creator can join later, cancel participation, and rejoin
- A joined creator counts toward capacity
- A creator cannot join when the schedule is full
- User-facing schedule ownership labels display “작성자” instead of “리더”

Use two confirmed accounts in the live Supabase project for this manual check:

1. As user A, create a schedule and confirm A is listed as the schedule creator.
   If A selects participation during creation, confirm A is also listed as a
   joined participant.
2. As user B, join it, confirm the joined count increases, cancel, confirm it
   decreases, then rejoin and confirm it increases again.
3. Create a schedule with capacity 2 and have the creator join it. Confirm the
   creator occupies one place, B fills the final place, and a third account
   receives `schedule_full`.
4. Change a joined schedule to `completed`. Confirm the UI has no cancel button
   and a direct `cancel_schedule_participation` RPC call returns
   `schedule_finalized` without changing the participant row.
5. Change a schedule to `cancelled`. Confirm join and cancellation are both
   rejected by their RPCs and the participant data remains unchanged.

To check capacity concurrency, leave exactly one place, sign in as two different
users other than the creator in separate clients, and invoke `join_schedule` at nearly the
same time. Verify one call succeeds, the other returns `schedule_full`, and this
query never returns a count greater than `max_participants`:

```sql
select s.id, s.max_participants, count(sp.id) as joined_count
from public.schedules s
left join public.schedule_participants sp
  on sp.schedule_id = s.id and sp.status = 'joined'
where s.id = '<test-schedule-uuid>'
group by s.id, s.max_participants;
```

`join_schedule` intentionally retains its `FOR UPDATE` schedule-row lock to
serialize competing joins for the same capacity.

### Schedule privacy TODO

Authenticated users currently have SELECT access to participant rows so the
schedule detail page can build its participant list. The UI only displays
nickname, region, hiking level, and creator status; it never displays email.
The database API can nevertheless expose participant UUIDs and statuses across
schedules to authenticated callers. A future migration should replace this
broad policy with a schedule-scoped participant-directory RPC or restricted
view, after defining who may inspect each schedule's roster.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
