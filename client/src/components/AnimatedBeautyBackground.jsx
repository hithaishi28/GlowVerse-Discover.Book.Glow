import { Brush, Fan, Gem, Sparkles, SprayCan, WandSparkles } from 'lucide-react';

const items = [
  { Icon: Brush, label: 'Brush', className: 'left-[8%] top-[18%] animation-delay-0' },
  { Icon: SprayCan, label: 'Perfume', className: 'left-[78%] top-[16%] animation-delay-700' },
  { Icon: WandSparkles, label: 'Lipstick', className: 'left-[22%] top-[68%] animation-delay-1200' },
  { Icon: Fan, label: 'Hair dryer', className: 'left-[84%] top-[66%] animation-delay-1600' },
  { Icon: Gem, label: 'Accessory', className: 'left-[52%] top-[12%] animation-delay-2200' },
  { Icon: Sparkles, label: 'Glow', className: 'left-[58%] top-[78%] animation-delay-3000' }
];

export function AnimatedBeautyBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(190,52,85,.28),transparent_28%),radial-gradient(circle_at_82%_28%,rgba(197,151,74,.22),transparent_24%),radial-gradient(circle_at_50%_82%,rgba(111,143,114,.18),transparent_26%)]" />
      <div className="beauty-particles" />
      {items.map(({ Icon, label, className }) => (
        <div key={label} className={`floating-beauty absolute grid h-16 w-16 place-items-center rounded-2xl border border-white/15 bg-white/10 text-white shadow-glow backdrop-blur-md ${className}`}>
          <Icon size={28} />
        </div>
      ))}
    </div>
  );
}
