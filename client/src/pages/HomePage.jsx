import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, MapPin, Search, Sparkles, Trophy } from 'lucide-react';
import { fetchGoogleMapSalons, fetchSalons, fetchTrending } from '../api/client.js';
import { AIAssistant } from '../components/AIAssistant.jsx';
import { AnimatedBeautyBackground } from '../components/AnimatedBeautyBackground.jsx';
import { BeautyQuiz } from '../components/BeautyQuiz.jsx';
import { Button } from '../components/common/Button.jsx';
import { Skeleton } from '../components/common/Skeleton.jsx';
import { LocationSelector } from '../components/LocationSelector.jsx';
import { SalonDiscovery } from '../components/SalonDiscovery.jsx';
import { SearchFilters } from '../components/SearchFilters.jsx';
import { fallbackImages, fallbackSalons, filterFallbackSalons, memberships, salonAvailability } from '../data/fallback.js';

function loadSessionLocation() {
  try {
    const saved = sessionStorage.getItem('glowverse_selected_location');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

const bengaluruDefaultLocation = { type: 'manual', label: 'Bengaluru' };

function normalizeLocationQuery(location) {
  if (!location || location.type === 'gps') return '';
  const label = location.label.toLowerCase();
  if (label.includes('bengaluru') || label.includes('bangalore')) return '';
  const pinMap = {
    '560034': 'Koramangala',
    '560066': 'Whitefield',
    '560102': 'HSR Layout',
    '560038': 'Indiranagar',
    '560041': 'Jayanagar',
    '560098': 'RR Nagar',
    '560110': 'Ullal',
    '560072': 'Nagarbhavi',
    '560060': 'Kengeri',
    '560004': 'Basavanagudi',
    '560040': 'Vijayanagar',
    '560070': 'Padmanabhanagar',
    '560078': 'Kumaraswamy Layout',
    '560062': 'Kanakapura Road',
    '560085': 'Girinagar'
  };
  const pin = Object.keys(pinMap).find((item) => label.includes(item));
  return pin ? pinMap[pin] : location.label;
}

function hashText(value) {
  return String(value).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function haversineKm(from, to) {
  if (!from?.lat || !from?.lng || !to?.lat || !to?.lng) return null;
  const earthKm = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return Number((earthKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
}

function googleToSalon(place, index, locationLabel) {
  const template = fallbackSalons[index % fallbackSalons.length];
  const seed = hashText(place.id || place.name || index);
  const salon = {
    ...template,
    _id: `google-${place.id || index}`,
    name: place.name,
    slug: `google-${(place.name || 'salon').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${String(place.id || index).slice(-8)}`,
    address: place.address || template.address,
    locality: locationLabel || template.locality,
    rating: place.rating || template.rating,
    reviewCount: place.reviewCount || template.reviewCount,
    coordinates: place.coordinates?.lat ? place.coordinates : template.coordinates,
    contact: {
      phone: `+91 80 ${String(42000000 + seed).slice(0, 8)}`,
      email: `hello@${(place.name || 'salon').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 18) || 'salon'}.glowverse.app`,
      website: place.googleMapsUrl || template.contact.website
    },
    images: place.photos?.length ? place.photos : [fallbackImages[seed % fallbackImages.length], fallbackImages[(seed + 2) % fallbackImages.length], fallbackImages[(seed + 4) % fallbackImages.length]],
    openNow: place.openNow ?? template.openNow,
    popularity: place.popularity || template.popularity,
    preciseGoogleMapUrl: place.googleMapsUrl || template.preciseGoogleMapUrl,
    distanceKm: template.distanceKm,
    travelTimeMinutes: template.travelTimeMinutes,
    description: `${place.name} is a Google Maps salon result near ${locationLabel || 'Bengaluru'}, enhanced with GlowVerse booking, services, stylists, crowd intelligence, and payment flow.`
  };
  const availability = salonAvailability(salon);
  return {
    ...salon,
    openNow: place.openNow ?? availability.isOpen,
    availability,
    availableSlots: availability.availableSlots,
    crowd: {
      isOpen: availability.isOpen,
      isBeforeOpen: availability.isBeforeOpen,
      isAfterClose: availability.isAfterClose,
      level: availability.level,
      occupancy: availability.occupancy,
      waitMinutes: availability.isOpen ? Math.max(0, Math.round((availability.occupancy - 18) / 4)) : 0,
      note: availability.statusText,
      bestVisitWindow: availability.nextAvailableSlot,
      confidence: availability.isOpen ? 84 + (seed % 12) : null,
      liveUpdatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      todayBookings: availability.todayBookings
    }
  };
}

export function HomePage() {
  const [urlParams] = useSearchParams();
  const [filters, setFilters] = useState({ q: '', service: '', rating: '', priceRange: '', sort: 'distance', distance: '', luxury: '', ecoFriendly: '', openNow: '' });
  const [selectedLocation, setSelectedLocation] = useState(loadSessionLocation);
  const [salons, setSalons] = useState([]);
  const [trending, setTrending] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('grid');
  const [usedFallback, setUsedFallback] = useState(false);
  const [salonSearch, setSalonSearch] = useState('');
  const [pendingSalonJump, setPendingSalonJump] = useState(false);
  const salonResultsRef = useRef(null);

  function chooseLocation(location, jumpToSalons = true) {
    setSelectedLocation(location);
    setPendingSalonJump(jumpToSalons);
    sessionStorage.setItem('glowverse_selected_location', JSON.stringify(location));
  }

  function clearLocation() {
    setSelectedLocation(null);
    sessionStorage.removeItem('glowverse_selected_location');
  }

  function searchSalonByName(event) {
    event?.preventDefault?.();
    const query = salonSearch.trim();
    setFilters((current) => ({ ...current, q: query }));
    setPendingSalonJump(true);
  }

  useEffect(() => {
    const area = urlParams.get('area');
    const salon = urlParams.get('salon');
    if (salon) {
      setSalonSearch(salon);
      setFilters((current) => ({ ...current, q: salon }));
    }
    if (area) chooseLocation({ type: 'manual', label: area }, true);
    else if (salon) setPendingSalonJump(true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      const activeLocation = selectedLocation || bengaluruDefaultLocation;
      const locationQuery = normalizeLocationQuery(activeLocation);
      const mergedFilters = { ...filters, locality: locationQuery || undefined, q: filters.q };
      try {
        const coords = activeLocation.type === 'gps' ? { lat: activeLocation.lat, lng: activeLocation.lng } : {};
        const userCoords = coords.lat ? coords : fallbackSalons.find((salon) => salon.locality === locationQuery)?.coordinates;
        const googleData = await fetchGoogleMapSalons({ location: locationQuery || activeLocation.label, q: filters.q || undefined, ...coords });
        if (googleData.salons?.length) {
          const googleSalons = googleData.salons.map((place, index) => {
            const salon = googleToSalon(place, index, locationQuery || activeLocation.label);
            const distanceKm = haversineKm(userCoords, salon.coordinates) ?? salon.distanceKm;
            return { ...salon, distanceKm, travelTimeMinutes: Math.max(5, Math.round((distanceKm || 2) * 4)) };
          });
          sessionStorage.setItem('glowverse_google_salons', JSON.stringify(googleSalons));
          setSalons(googleSalons);
          setUsedFallback(false);
        } else {
          const data = await fetchSalons({ ...mergedFilters, ...coords });
          const nextSalons = data.salons?.length ? data.salons.map((salon) => {
            const availability = salonAvailability(salon);
            return { ...salon, availability, availableSlots: availability.availableSlots, openNow: availability.isOpen };
          }) : filterFallbackSalons(mergedFilters);
          setSalons(nextSalons);
          setUsedFallback(!data.salons?.length);
        }
      } catch {
        setSalons(filterFallbackSalons(mergedFilters));
        setUsedFallback(true);
      } finally {
        setLoading(false);
      }
    }, 160);
    return () => clearTimeout(timer);
  }, [filters, selectedLocation]);

  useEffect(() => {
    if (!pendingSalonJump || loading) return;
    salonResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', '#salons');
    setPendingSalonJump(false);
  }, [salons.length, loading, pendingSalonJump, selectedLocation]);

  useEffect(() => {
    fetchTrending().then(setTrending).catch(() => {
      setTrending({
        treatments: ['Keratin Smoothening', 'Hydra Facial', 'Aroma Body Spa', 'Chrome Nail Art'],
        hairstyles: ['Glass Hair Bob', 'Butterfly Layers', 'Soft Curls'],
        makeupLooks: ['Dewy Bridal', 'Soft Glam', 'Reception Glow']
      });
    });
  }, []);

  const featured = useMemo(() => salons, [salons]);
  const resultLabel = selectedLocation?.label || 'all Bengaluru areas';

  return (
    <>
      <section className="section pt-8">
        <div className="grid gap-4">
          <LocationSelector selectedLocation={selectedLocation} onSelectLocation={chooseLocation} onClearLocation={clearLocation} />
          <form onSubmit={searchSalonByName} className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow-glow backdrop-blur-xl">
            <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr] lg:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-gold">Search Bangalore salons</p>
                <h2 className="mt-2 font-display text-3xl font-black">Find any salon by name</h2>
                <p className="mt-2 text-sm text-ink/65 dark:text-white/65">Search salon names across Bengaluru, or combine it with the selected location above.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <label className="relative block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/45 dark:text-white/45" size={18} />
                  <input className="focus-ring h-12 w-full rounded-md border border-ink/10 bg-pearl pl-10 pr-3 font-bold dark:border-white/10 dark:bg-ink" value={salonSearch} onChange={(event) => setSalonSearch(event.target.value)} placeholder="Search salon name, e.g. LuxeGlow, Natura, F Salon" />
                </label>
                <Button type="submit"><Search size={17} /> Search</Button>
              </div>
            </div>
          </form>
          </div>
      </section>

      <section className="relative overflow-hidden bg-ink text-white">
        <AnimatedBeautyBackground />
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1800&q=80" alt="" className="h-full w-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/82 to-rose/20" />
        </div>
        <div className="section relative grid min-h-[72vh] content-center gap-8 py-20">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-3xl">
            <p className="mb-4 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-gold backdrop-blur">Client Discovery</p>
            <h1 className="font-display text-5xl font-black leading-tight sm:text-7xl">Find salons near you</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/78">Explore salons across Bengaluru immediately, then refine by area, name, service, rating, price, and distance.</p>
          </motion.div>
        </div>
      </section>

      <section className="section mt-8">
        <SearchFilters filters={filters} setFilters={setFilters} />
      </section>

      <section id="salons" ref={salonResultsRef} className="section scroll-mt-24 mt-10">
        <>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-black">Bengaluru salon directory</h2>
              <p className="mt-2 text-ink/65 dark:text-white/65">
                Showing salons for <span className="font-black text-rose">{resultLabel}</span>
                {usedFallback ? ' using local real-name salon listings. Add a valid Google Places key for live Google results.' : ' from Google Places or live API.'}
              </p>
            </div>
            <Button variant="secondary" onClick={() => setFilters({ ...filters, sort: 'distance' })}><MapPin size={17} /> Sort by Distance</Button>
          </div>
          <div className="mt-6">
            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-80" />)}
              </div>
            ) : featured.length ? (
              <SalonDiscovery salons={featured} view={view} setView={setView} selectedLocation={selectedLocation || bengaluruDefaultLocation} />
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/10 p-8 text-center shadow-glow backdrop-blur-xl">
                <h3 className="text-2xl font-black">No salons found here yet</h3>
                <p className="mt-3 text-sm text-ink/65 dark:text-white/65">Try Bengaluru, Koramangala, Whitefield, HSR Layout, Indiranagar, Jayanagar, or clear the search filters.</p>
                <Button className="mt-5" variant="secondary" onClick={() => { clearLocation(); setFilters({ q: '', service: '', rating: '', priceRange: '', sort: 'distance', distance: '', luxury: '', ecoFriendly: '', openNow: '' }); setSalonSearch(''); }}>Show all Bengaluru salons</Button>
              </div>
            )}
          </div>
        </>
      </section>

      <section className="section mt-16 grid gap-5 lg:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/10 p-6 shadow-glow backdrop-blur-xl">
          <Sparkles className="text-rose" />
          <h2 className="mt-4 font-display text-2xl font-black">Trending services</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {(trending?.treatments || ['Keratin Smoothening', 'Hydra Facial', 'Aroma Body Spa']).map((item) => <span key={item} className="rounded-full bg-rose/10 px-3 py-2 text-sm font-bold text-rose">{item}</span>)}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/10 p-6 shadow-glow backdrop-blur-xl">
          <Trophy className="text-gold" />
          <h2 className="mt-4 font-display text-2xl font-black">Rewards</h2>
          <p className="mt-3 text-sm leading-6 text-ink/70 dark:text-white/70">Points per booking, referrals, badges, milestones, redemption, and a daily Spin & Win wheel.</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/10 p-6 shadow-glow backdrop-blur-xl">
          <Gift className="text-sage" />
          <h2 className="mt-4 font-display text-2xl font-black">Gift cards</h2>
          <p className="mt-3 text-sm leading-6 text-ink/70 dark:text-white/70">Custom amounts, scheduled delivery, send-to-friend flows, and QR redemption.</p>
        </div>
      </section>

      <section className="section mt-16 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <AIAssistant />
        <BeautyQuiz />
      </section>

      <section className="section mt-16">
        <h2 className="font-display text-3xl font-black">Membership plans</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {memberships.map((plan) => (
            <div key={plan.tier} className="rounded-xl border border-white/10 bg-white/10 p-6 shadow-glow backdrop-blur-xl">
              <h3 className="text-2xl font-black">{plan.tier}</h3>
              <p className="mt-2 text-3xl font-black text-rose">{plan.discount}</p>
              <p className="text-sm font-bold text-ink/60 dark:text-white/60">{plan.price}</p>
              <ul className="mt-4 space-y-2 text-sm">{plan.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}</ul>
            </div>
          ))}
        </div>
      </section>

    </>
  );
}
