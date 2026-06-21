import { CheckCircle2 } from 'lucide-react';
import { createPortal } from 'react-dom';

export function Toast({ message }) {
  if (!message) return null;

  const toast = (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-[999999] flex min-h-16 w-[min(92vw,420px)] -translate-x-1/2 items-center gap-4 rounded-2xl border border-sage/30 bg-white px-5 py-4 text-ink shadow-2xl dark:bg-ink dark:text-white"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sage text-white">
        <CheckCircle2 size={28} />
      </span>
      <span className="text-base font-black">{message}</span>
    </div>
  );

  return createPortal(toast, document.body);
}