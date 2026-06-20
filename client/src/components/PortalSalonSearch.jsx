import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search } from 'lucide-react';
import { Button } from './common/Button.jsx';
import { localities } from '../data/fallback.js';

export function PortalSalonSearch({ title = 'Search salons across Bengaluru', compact = false }) {
  const navigate = useNavigate();
  const [area, setArea] = useState('Bengaluru');
  const [salon, setSalon] = useState('');

  function submit(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (area) params.set('area', area);
    if (salon.trim()) params.set('salon', salon.trim());
    navigate(`/discover?${params.toString()}`);
  }

  return (
    <form onSubmit={submit} className={`rounded-xl border border-white/10 bg-white/10 shadow-glow backdrop-blur-xl ${compact ? 'p-4' : 'p-5'}`}>
      <div className="grid gap-3 lg:grid-cols-[1fr_180px_1.2fr_auto] lg:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-gold">Bengaluru salon finder</p>
          <h2 className="mt-1 font-display text-2xl font-black">{title}</h2>
        </div>
        <label className="block">
          <span className="mb-1 block text-xs font-black uppercase text-ink/55 dark:text-white/55">Location</span>
          <select className="focus-ring h-11 w-full rounded-md border border-ink/10 bg-pearl px-3 text-sm font-bold dark:border-white/10 dark:bg-ink" value={area} onChange={(event) => setArea(event.target.value)}>
            {['Bengaluru', ...localities].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-black uppercase text-ink/55 dark:text-white/55">Salon name</span>
          <span className="relative block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/45 dark:text-white/45" size={17} />
            <input className="focus-ring h-11 w-full rounded-md border border-ink/10 bg-pearl pl-10 pr-3 text-sm font-bold dark:border-white/10 dark:bg-ink" value={salon} onChange={(event) => setSalon(event.target.value)} placeholder="Search LuxeGlow, Natura, F Salon..." />
          </span>
        </label>
        <Button type="submit"><MapPin size={16} /> Search</Button>
      </div>
    </form>
  );
}
