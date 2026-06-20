import { Sparkles } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2" aria-label="GlowVerse">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-ink text-gold shadow-glow dark:bg-pearl dark:text-rose">
        <Sparkles size={19} />
      </span>
      <span className="font-display text-xl font-black tracking-normal">
        Glow<span className="text-rose">Verse</span>
      </span>
    </div>
  );
}
