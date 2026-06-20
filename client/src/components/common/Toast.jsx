export function Toast({ message }) {
  if (!message) return null;
  return (
    <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-md bg-ink px-4 py-3 text-sm font-semibold text-white shadow-glow dark:bg-pearl dark:text-ink">
      {message}
    </div>
  );
}
