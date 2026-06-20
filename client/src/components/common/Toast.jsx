import { CheckCircle2 } from 'lucide-react';

export function Toast({ message }) {
  if (!message) return null;
  const success = /added to cart|added to wishlist|payment successful|confirmed|download started/i.test(message);
  if (success) {
    return (
      <div role="status" className="fixed left-1/2 top-24 z-[9999] flex min-h-16 w-[min(92vw,420px)] -translate-x-1/2 items-center gap-4 rounded-2xl border border-sage/30 bg-white px-5 py-4 text-ink shadow-glow dark:bg-ink dark:text-white">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sage text-white">
          <CheckCircle2 size={28} />
        </span>
        <span className="text-base font-black">{message}</span>
      </div>
    );
  }
  return (
    <div role="status" className="fixed bottom-5 left-1/2 z-50 flex min-h-14 -translate-x-1/2 items-center gap-3 rounded-xl bg-ink px-5 py-3 text-sm font-black text-white shadow-glow dark:bg-pearl dark:text-ink">
      <span>{message}</span>
    </div>
  );
}
