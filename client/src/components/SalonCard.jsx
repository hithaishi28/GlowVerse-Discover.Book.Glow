import { Link } from 'react-router-dom';
import { Heart, Leaf, MapPin, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { CrowdIndicator } from './CrowdIndicator.jsx';
import { fetchWishlist, toggleWishlistSalon } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useEffect, useState } from 'react';

export function SalonCard({ salon }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user?.role !== 'user' || !salon._id) return;
    let cancelled = false;
    fetchWishlist()
      .then((data) => {
        if (!cancelled) setSaved((data.salons || []).some((item) => String(item._id) === String(salon._id)));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [salon._id, user?.role]);

  async function toggleSave(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!user) {
      window.location.assign('/client/login');
      return;
    }
    setBusy(true);
    try {
      const result = await toggleWishlistSalon(salon._id);
      setSaved(result.saved);
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.article layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-2xl border border-white/10 bg-white/80 shadow-sm backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-glow dark:bg-white/5">
      <Link to={`/salons/${salon.slug}`}>
        <div className="relative">
          <img src={salon.images?.[0]} alt={salon.name} className="h-52 w-full object-cover" />
          <div className="absolute bottom-3 left-3 rounded-full bg-ink/80 px-3 py-1 text-xs font-black text-white backdrop-blur">{salon.availability?.statusText || (salon.openNow ? 'Open now' : 'Closed')}</div>
          <button type="button" disabled={busy} onClick={toggleSave} className="focus-ring absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-rose shadow transition hover:scale-105">
            <Heart size={18} fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-black">{salon.name}</h3>
              <p className="mt-1 flex items-center gap-1 text-sm text-ink/65 dark:text-white/65">
                <MapPin size={15} /> {salon.locality}
              </p>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink/55 dark:text-white/55">{salon.address}</p>
            </div>
            <span className="flex items-center gap-1 rounded-md bg-gold/15 px-2 py-1 text-sm font-bold text-ink dark:text-gold">
              <Star size={15} fill="currentColor" /> {salon.rating}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            {salon.luxury && <span className="rounded-full bg-rose/10 px-2 py-1 text-rose">Luxury</span>}
            {salon.ecoFriendly && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sage/15 px-2 py-1 text-sage">
                <Leaf size={13} /> Eco
              </span>
            )}
            {salon.distanceKm != null && <span className="rounded-full bg-ink/5 px-2 py-1 dark:bg-white/10">{salon.distanceKm} km</span>}
          </div>
          <CrowdIndicator crowd={salon.crowd} compact />
        </div>
      </Link>
    </motion.article>
  );
}
