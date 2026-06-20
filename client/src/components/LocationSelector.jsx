import { useMemo, useState } from 'react';
import { ChevronDown, Crosshair, MapPin, Search, X } from 'lucide-react';
import { Button } from './common/Button.jsx';
import { localities } from '../data/fallback.js';

const pinSuggestions = [
  '560034 Koramangala',
  '560066 Whitefield',
  '560102 HSR Layout',
  '560038 Indiranagar',
  '560041 Jayanagar',
  '560098 RR Nagar',
  '560110 Ullal',
  '560072 Nagarbhavi',
  '560060 Kengeri',
  '560004 Basavanagudi',
  '560040 Vijayanagar',
  '560070 Padmanabhanagar',
  '560078 Kumaraswamy Layout',
  '560062 Kanakapura Road',
  '560085 Girinagar'
];

const suggestions = [...localities, 'Bengaluru', 'Bangalore', ...pinSuggestions];

export function LocationSelector({ selectedLocation, onSelectLocation, onClearLocation }) {
  const [areaQuery, setAreaQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  const matches = useMemo(() => {
    const query = areaQuery.trim().toLowerCase();
    if (!query) return localities;
    return suggestions.filter((item) => item.toLowerCase().includes(query)).slice(0, 12);
  }, [areaQuery]);

  function selectManual(value = selectedArea || areaQuery) {
    const label = value.trim();
    if (!label) {
      setError('Select an area from the dropdown before continuing.');
      return;
    }
    setError('');
    setOpen(false);
    onSelectLocation({ type: 'manual', label });
  }

  function pickArea(value) {
    setSelectedArea(value);
    setAreaQuery(value);
    setOpen(false);
    setError('');
  }

  function useCurrentLocation() {
    setLocating(true);
    setError('');
    if (!navigator.geolocation) {
      setLocating(false);
      onSelectLocation({ type: 'gps', label: 'Current location, Bengaluru', lat: 12.9716, lng: 77.5946 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        onSelectLocation({
          type: 'gps',
          label: 'Current location, Bengaluru',
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      () => {
        setLocating(false);
        setError('Location permission was unavailable, so Bengaluru center is selected for demo discovery.');
        onSelectLocation({ type: 'gps', label: 'Bengaluru center', lat: 12.9716, lng: 77.5946 });
      },
      { timeout: 3500 }
    );
  }

  if (selectedLocation) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/10 p-4 shadow-glow backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-gold">Selected location</p>
            <p className="mt-1 flex items-center gap-2 text-lg font-black"><MapPin className="text-rose" size={20} /> {selectedLocation.label}</p>
          </div>
          <Button variant="secondary" onClick={onClearLocation}><X size={17} /> Change Location</Button>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow-glow backdrop-blur-xl">
      <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <div>
          <p className="inline-flex rounded-full bg-gold/15 px-3 py-1 text-xs font-black uppercase tracking-wide text-gold">Location required</p>
          <h2 className="mt-4 font-display text-3xl font-black">Choose where you want to glow</h2>
          <p className="mt-3 text-sm leading-6 text-ink/70 dark:text-white/70">Choose GPS or select a Bangalore area from the dropdown, then press Go to load salons for that area.</p>
          <Button className="mt-5" onClick={useCurrentLocation} disabled={locating}>
            <Crosshair size={18} /> {locating ? 'Detecting location...' : 'Use Current Location'}
          </Button>
        </div>

        <div>
          <div className="relative">
            <label className="relative block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/45 dark:text-white/45" size={18} />
              <input
                className="focus-ring h-12 w-full rounded-md border border-ink/10 bg-pearl pl-10 pr-10 dark:border-white/10 dark:bg-ink"
                placeholder="Search and select Bangalore area"
                value={areaQuery}
                onFocus={() => setOpen(true)}
                onChange={(event) => {
                  setAreaQuery(event.target.value);
                  setSelectedArea('');
                  setOpen(true);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') selectManual(matches[0] || areaQuery);
                }}
              />
              <button type="button" aria-label="Open area dropdown" onClick={() => setOpen((current) => !current)} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md hover:bg-ink/5 dark:hover:bg-white/10">
                <ChevronDown size={18} />
              </button>
            </label>
            {open && (
              <div className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-ink/10 bg-white p-2 shadow-glow dark:border-white/10 dark:bg-ink">
                {matches.map((item) => (
                  <button key={item} type="button" onClick={() => pickArea(item)} className="focus-ring block w-full rounded-md px-3 py-3 text-left text-sm font-bold hover:bg-rose/10">
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button className="mt-4 w-full" variant="secondary" onClick={() => selectManual()}>
            <MapPin size={17} /> Go
          </Button>
          {error && <p className="mt-3 rounded-md bg-gold/15 p-3 text-sm font-bold text-gold">{error}</p>}
        </div>
      </div>
    </section>
  );
}
