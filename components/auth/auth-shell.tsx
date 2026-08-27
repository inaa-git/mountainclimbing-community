import Link from "next/link";

export function AuthShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <Link className="text-sm font-semibold text-zinc-600" href="/">
          ← 홈
        </Link>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-zinc-950">{title}</h1>
        <p className="mt-2 mb-7 text-sm leading-6 text-zinc-600">{description}</p>
        {children}
      </section>
    </main>
  );
}
