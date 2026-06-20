import { CheckCircle2 } from 'lucide-react';

export function Toast({ message }) {
  if (!message) return null;
  const success = /added to cart|added to wishlist|payment successful|confirmed|download started/i.test(message);
  return (
    <div role="status" className={`fixed bottom-5 left-1/2 z-50 flex min-h-14 -translate-x-1/2 items-center gap-3 rounded-xl px-5 py-3 text-sm font-black shadow-glow ${success ? 'bg-sage text-white' : 'bg-ink text-white dark:bg-pearl dark:text-ink'}`}>
      {success && <CheckCircle2 size={22} className="shrink-0" />}
      <span>{message}</span>
    </div>
  );
}
