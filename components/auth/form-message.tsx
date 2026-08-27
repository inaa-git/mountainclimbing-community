export function FormMessage({ message, success = false }: { message: string; success?: boolean }) {
  return (
    <p
      role={success ? "status" : "alert"}
      className={`rounded-lg px-4 py-3 text-sm ${
        success ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
      }`}
    >
      {message}
    </p>
  );
}
