import { ExternalLink, Grid2X2, LayoutList, Map, MapPin, Navigation, Rows3, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SalonCard } from './SalonCard.jsx';
import { CrowdIndicator } from './CrowdIndicator.jsx';

const views = [
  ['grid', Grid2X2],
  ['list', LayoutList],
  ['card', Rows3],
  ['map', Map]
];

function markerPosition(salon, salons) {
  const lats = salons.map((item) => item.coordinates?.lat).filter(Number.isFinite);
  const lngs = salons.map((item) => item.coordinates?.lng).filter(Number.isFinite);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const x = ((salon.coordinates.lng - minLng) / Math.max(0.001, maxLng - minLng)) * 76 + 12;
  const y = (1 - ((salon.coordinates.lat - minLat) / Math.max(0.001, maxLat - minLat))) * 68 + 14;
  return { left: `${Math.min(88, Math.max(8, x))}%`, top: `${Math.min(84, Math.max(10, y))}%` };
}

export function SalonDiscovery({ salons, view, setView, selectedLocation }) {
  const mapQuery = encodeURIComponent(`salons near ${selectedLocation?.label || 'Bengaluru'}`);
  const mapSrc = `https://www.google.com/maps?q=${mapQuery}&z=12&output=embed`;
  const liveGoogleSearchUrl = `https://www.google.com/maps/search/${mapQuery}`;
  const averageCrowd = Math.round(salons.reduce((sum, salon) => sum + (salon.crowd?.occupancy || 0), 0) / Math.max(salons.length, 1));
  const fastestSalon = [...salons].sort((a, b) => (a.crowd?.waitMinutes || 99) - (b.crowd?.waitMinutes || 99))[0];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl font-black">Live-style Bengaluru discovery</h2>
          <p className="mt-2 text-sm text-ink/65 dark:text-white/65">Map, grid, list, and card views for {selectedLocation?.label || 'your selected area'} with rating, distance, price range, service, and availability filters.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-md bg-ink px-3 py-2 text-sm font-bold text-white dark:bg-white dark:text-ink" href={liveGoogleSearchUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={16} /> Open Bengaluru Maps search
          </a>
          <div className="flex rounded-md border border-ink/10 bg-white p-1 dark:border-white/10 dark:bg-white/5">
            {views.map(([key, Icon]) => (
              <button key={key} aria-label={`${key} view`} onClick={() => setView(key)} className={`focus-ring grid h-10 w-10 place-items-center rounded-md ${view === key ? 'bg-rose text-white' : 'text-ink/70 dark:text-white/70'}`}>
                <Icon size={18} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/10 p-4 shadow-sm backdrop-blur-xl">
          <p className="text-xs font-black uppercase text-gold">Crowd detection</p>
          <p className="mt-2 text-2xl font-black">{averageCrowd}% area occupancy</p>
          <p className="mt-1 text-sm text-ink/60 dark:text-white/60">Live-style demand signal from bookings, slots, and wait estimates.</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/10 p-4 shadow-sm backdrop-blur-xl">
          <p className="text-xs font-black uppercase text-gold">Fastest option</p>
          <p className="mt-2 text-2xl font-black">{fastestSalon?.name || 'Select location'}</p>
          <p className="mt-1 text-sm text-ink/60 dark:text-white/60">{fastestSalon?.crowd?.waitMinutes || 0} min estimated wait.</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/10 p-4 shadow-sm backdrop-blur-xl">
          <p className="text-xs font-black uppercase text-gold">Precision maps</p>
          <p className="mt-2 text-2xl font-black">{salons.length} mapped salons</p>
          <p className="mt-1 text-sm text-ink/60 dark:text-white/60">Coordinates, directions, and Google Maps search deep links.</p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-gradient-to-r from-rose/10 via-white/10 to-gold/10 p-4 shadow-sm backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-gold">Google Maps source</p>
            <p className="mt-1 text-sm text-ink/70 dark:text-white/70">
              Live Google Maps salon search link connected for {selectedLocation?.label || 'Bengaluru'}. Add a browser-restricted Google Maps API key in env to fetch Places API listings directly.
            </p>
          </div>
          <a className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-md bg-rose px-3 py-2 text-sm font-bold text-white" href={liveGoogleSearchUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={16} /> Open Bengaluru Maps search
          </a>
        </div>
      </div>

      {view === 'map' && (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/10 shadow-glow backdrop-blur-xl">
          <div className="grid gap-0 lg:grid-cols-[1.2fr_.8fr]">
            <div className="relative h-[520px] overflow-hidden bg-[linear-gradient(135deg,rgba(190,52,85,.16),rgba(197,151,74,.12)),url('https://tile.openstreetmap.org/12/2931/1905.png')] bg-cover">
              <iframe title="Live Bengaluru salon map" src={mapSrc} className="absolute inset-0 h-full w-full border-0 opacity-35" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              {salons.filter((salon) => salon.coordinates?.lat && salon.coordinates?.lng).map((salon) => (
                <Link
                  key={salon._id}
                  to={`/salons/${salon.slug}`}
                  title={salon.name}
                  className="focus-ring absolute z-10 grid h-10 w-10 -translate-x-1/2 -translate-y-full place-items-center rounded-full bg-rose text-white shadow-glow"
                  style={markerPosition(salon, salons)}
                >
                  <MapPin size={20} fill="currentColor" />
                </Link>
              ))}
            </div>
            <div className="max-h-[520px] space-y-3 overflow-auto p-4">
              <div className="rounded-md bg-ink/5 p-3 text-sm dark:bg-white/10">
                <Search size={16} className="mr-2 inline text-rose" /> Each marker opens the matching salon detail page. Google Maps search is centered on {selectedLocation?.label || 'Bengaluru'} salons.
              </div>
              {salons.map((salon) => (
                <article key={salon._id} className="rounded-xl bg-white p-4 shadow-sm dark:bg-ink/70">
                  <p className="font-black">{salon.name}</p>
                  <p className="mt-1 text-sm text-ink/65 dark:text-white/65">{salon.rating} stars - {salon.address}</p>
                  <p className="mt-2 text-xs font-bold text-rose">{salon.services.slice(0, 4).map((service) => service.name).join(' / ')}</p>
                  <div className="mt-3"><CrowdIndicator crowd={salon.crowd} compact /></div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a className="inline-flex items-center gap-2 rounded-md bg-rose px-3 py-2 text-sm font-bold text-white" href={`https://www.google.com/maps/dir/?api=1&destination=${salon.coordinates.lat},${salon.coordinates.lng}`} target="_blank" rel="noreferrer">
                      <Navigation size={15} /> Navigate
                    </a>
                    <a className="inline-flex items-center gap-2 rounded-md bg-ink px-3 py-2 text-sm font-bold text-white dark:bg-white dark:text-ink" href={salon.preciseGoogleMapUrl} target="_blank" rel="noreferrer">
                      <Map size={15} /> Verify on Maps
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === 'grid' && <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{salons.map((salon) => <SalonCard key={salon._id} salon={salon} />)}</div>}

      {view === 'list' && (
        <div className="space-y-3">
          {salons.map((salon) => (
            <article key={salon._id} className="grid gap-4 rounded-xl border border-white/10 bg-white/80 p-4 shadow-sm backdrop-blur-xl dark:bg-white/5 md:grid-cols-[180px_1fr_auto]">
              <img src={salon.images[0]} alt={salon.name} className="h-32 w-full rounded-md object-cover" />
              <div>
                <h3 className="text-xl font-black">{salon.name}</h3>
                <p className="mt-1 text-sm text-ink/65 dark:text-white/65">{salon.address}</p>
                <p className="mt-2 text-sm font-bold text-rose">{salon.services.slice(0, 5).map((service) => service.name).join(' / ')}</p>
                <div className="mt-3 max-w-sm"><CrowdIndicator crowd={salon.crowd} compact /></div>
              </div>
              <div className="text-sm font-bold">
                <p>{salon.rating} stars</p>
                <p>{salon.distanceKm} km</p>
                <Link className="mt-4 inline-flex min-h-11 items-center rounded-md bg-rose px-4 py-2 text-sm font-bold text-white" to={`/salons/${salon.slug}`}>Open</Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {view === 'card' && (
        <div className="grid gap-5 md:grid-cols-2">
          {salons.map((salon) => (
            <article key={salon._id} className="rounded-xl border border-white/10 bg-white/10 p-5 shadow-glow backdrop-blur-xl">
              <img src={salon.images[1]} alt={salon.name} className="h-56 w-full rounded-lg object-cover" />
              <h3 className="mt-4 text-2xl font-black">{salon.name}</h3>
              <p className="mt-2 text-sm text-ink/65 dark:text-white/65">{salon.description}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
                <span className="rounded-full bg-gold/15 px-3 py-1 text-gold">{salon.rating} stars</span>
                <span className="rounded-full bg-rose/10 px-3 py-1 text-rose">{salon.openNow ? 'Open now' : 'Closed'}</span>
                <span className="rounded-full bg-sage/15 px-3 py-1 text-sage">{salon.distanceKm} km</span>
              </div>
              <div className="mt-4"><CrowdIndicator crowd={salon.crowd} /></div>
              <Link className="mt-4 inline-flex min-h-11 items-center rounded-md bg-rose px-4 py-2 text-sm font-bold text-white" to={`/salons/${salon.slug}`}>Open</Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
