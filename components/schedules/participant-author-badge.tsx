export function ParticipantAuthorBadge({ isAuthor }: { isAuthor: boolean }) {
  if (!isAuthor) return null;

  return (
    <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
      작성자
    </span>
  );
}
