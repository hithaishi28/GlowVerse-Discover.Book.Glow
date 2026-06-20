import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, ExternalLink, Heart, Leaf, MapPin, Navigation, Phone, ShoppingCart, Star } from 'lucide-react';
import { addToCart, fetchSalon, fetchWishlist, toggleWishlistService } from '../api/client.js';
import { BookingFlow } from '../components/BookingFlow.jsx';
import { CrowdIndicator } from '../components/CrowdIndicator.jsx';
import { Skeleton } from '../components/common/Skeleton.jsx';
import { Toast } from '../components/common/Toast.jsx';
import { fallbackSalonDetails, salonAvailability } from '../data/fallback.js';
import { Button } from '../components/common/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { addLocalCartService, getLocalOffers, getLocalWishlist, toggleLocalWishlistService } from './customerUtils.jsx';

function googleSalonDetails(slug) {
  try {
    const salons = JSON.parse(sessionStorage.getItem('glowverse_google_salons') || '[]');
    const salon = salons.find((item) => item.slug === slug);
    if (!salon) return null;
    const availability = salonAvailability(salon);
    const liveSalon = {
      ...salon,
      availability,
      availableSlots: availability.availableSlots,
      openNow: availability.isOpen,
      crowd: {
        ...salon.crowd,
        isOpen: availability.isOpen,
        isBeforeOpen: availability.isBeforeOpen,
        isAfterClose: availability.isAfterClose,
        level: availability.level,
        occupancy: availability.occupancy,
        waitMinutes: availability.isOpen ? Math.max(0, Math.round((availability.occupancy - 18) / 4)) : 0,
        note: availability.statusText,
        bestVisitWindow: availability.nextAvailableSlot,
        confidence: availability.isOpen ? salon.crowd?.confidence : null,
        todayBookings: availability.todayBookings,
        liveUpdatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    };
    const reviews = ['Accurate Google location and smooth booking.', 'Clean salon, helpful staff, and punctual slots.', 'Good stylist recommendation for my service.', 'Transparent pricing and easy directions.', 'The appointment flow was quick.'].map((comment, index) => ({
      _id: `google-review-${salon._id}-${index}`,
      userName: ['Neha', 'Priya', 'Kavya', 'Aman', 'Ira'][index],
      rating: index === 3 ? 4 : Math.round(liveSalon.rating || 5),
      comment,
      verified: true,
      helpfulVotes: 9 - index
    }));
    return {
      salon: liveSalon,
      reviews,
      ratingDistribution: [5, 4, 3, 2, 1].map((rating) => ({ rating, count: reviews.filter((review) => review.rating === rating).length })),
      aiSentimentSummary: `${Math.round((liveSalon.rating || 4.5) * 20)}% of available signals are positive, with guests valuing location accuracy, staff skill, and appointment punctuality.`
    };
  } catch {
    return null;
  }
}

export function SalonDetailsPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [toast, setToast] = useState('');
  const [savedServices, setSavedServices] = useState(new Set());
  const [localOffers, setLocalOffers] = useState([]);

  useEffect(() => {
    setData(null);
    if (slug?.startsWith('google-')) {
      setData(googleSalonDetails(slug) || fallbackSalonDetails(slug));
      return;
    }
    if (slug?.startsWith('demo-')) {
      setData(fallbackSalonDetails(slug));
      return;
    }
    fetchSalon(slug)
      .then(setData)
      .catch(() => setData(fallbackSalonDetails(slug)));
  }, [slug]);

  useEffect(() => {
    if (!user || !data?.salon?._id) return;
    fetchWishlist()
      .then((wishlist) => setSavedServices(new Set((wishlist.services || []).map((item) => item.serviceId))))
      .catch(() => setSavedServices(new Set((getLocalWishlist().services || []).map((item) => item.serviceId))));
  }, [data?.salon?._id, user]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), /added to cart/i.test(toast) ? 4000 : 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!data?.salon) return undefined;
    const loadLocalOffers = () => {
      const offers = getLocalOffers().filter((offer) => offer.salonId === data.salon._id || offer.salon === data.salon._id || offer.salonName === data.salon.name);
      setLocalOffers(offers);
    };
    loadLocalOffers();
    window.addEventListener('glowverse-local-customer-updated', loadLocalOffers);
    return () => window.removeEventListener('glowverse-local-customer-updated', loadLocalOffers);
  }, [data?.salon]);

  if (!data) return <div className="section py-10"><Skeleton className="h-[70vh]" /></div>;

  const { salon, reviews, ratingDistribution, aiSentimentSummary } = data;
  const mapSrc = `https://www.google.com/maps?q=${salon.coordinates.lat},${salon.coordinates.lng}&z=14&output=embed`;
  const activeOffers = [...(salon.offers || []), ...localOffers]
    .filter((offer) => offer.active !== false)
    .filter((offer) => !offer.validUntil || new Date(offer.validUntil) >= new Date(new Date().toDateString()));

  async function saveService(service) {
    if (!user || user.role !== 'user') {
      window.location.assign('/client/login');
      return;
    }
    try {
      const result = await toggleWishlistService({ salonId: salon._id, serviceId: service._id });
      setSavedServices((current) => {
        const next = new Set(current);
        if (result.saved) next.add(service._id);
        else next.delete(service._id);
        return next;
      });
      setToast(result.saved ? 'Service added to wishlist.' : 'Service removed from wishlist.');
    } catch (error) {
      const result = toggleLocalWishlistService(salon, service);
      setSavedServices((current) => {
        const next = new Set(current);
        if (result.saved) next.add(service._id);
        else next.delete(service._id);
        return next;
      });
      setToast(result.saved ? 'Service added to wishlist.' : 'Service removed from wishlist.');
    }
  }

  async function addService(service) {
    if (!user || user.role !== 'user') {
      window.location.assign('/client/login');
      return;
    }
    try {
      await addToCart({ salonId: salon._id, serviceId: service._id, quantity: 1 });
      setToast('Added to cart');
      setTimeout(() => setToast(""), 2000);
    } catch (error) {
      addLocalCartService(salon, service);
      setToast('Added to cart');
      setTimeout(() => setToast(""), 2000);
    }
  }

  return (
    <section className="section py-8">
      <Toast message={toast} />
      <div className="grid gap-4 md:grid-cols-3">
        <img src={salon.images[0]} alt={salon.name} className="h-72 w-full rounded-xl object-cover shadow-glow md:col-span-2" />
        <div className="grid gap-4">
          {salon.images.slice(1, 3).map((image) => <img key={image} src={image} alt="" className="h-32 w-full rounded-xl object-cover md:h-[8.5rem]" />)}
        </div>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_420px]">
        <div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl font-black">{salon.name}</h1>
              <p className="mt-3 flex items-center gap-2 text-ink/65 dark:text-white/65"><MapPin size={18} /> {salon.address}</p>
            </div>
            <div className="rounded-md bg-gold/15 px-3 py-2 font-black text-gold"><Star size={17} className="inline" fill="currentColor" /> {salon.rating}</div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 text-sm font-bold">
            <span className="rounded-full bg-ink px-3 py-1 text-white dark:bg-white dark:text-ink"><Clock size={14} className="inline" /> {salon.workingHours.open}-{salon.workingHours.close}</span>
            <span className="rounded-full bg-gold/15 px-3 py-1 text-gold">{salon.availability?.statusText || (salon.openNow ? 'Open now' : 'Closed Now')}</span>
            <span className="rounded-full bg-rose/10 px-3 py-1 text-rose"><Phone size={14} className="inline" /> {salon.contact.phone}</span>
            {salon.ecoFriendly && <span className="rounded-full bg-sage/15 px-3 py-1 text-sage"><Leaf size={14} className="inline" /> Organic / Cruelty-free / Sustainable</span>}
          </div>
          <p className="mt-6 leading-7 text-ink/75 dark:text-white/75">{salon.description}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a className="inline-flex min-h-11 items-center gap-2 rounded-md bg-rose px-4 py-2 text-sm font-bold text-white" href={`https://www.google.com/maps/dir/?api=1&destination=${salon.coordinates.lat},${salon.coordinates.lng}`} target="_blank" rel="noreferrer">
              <Navigation size={17} /> Get directions
            </a>
            <a className="inline-flex min-h-11 items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-bold text-white dark:bg-white dark:text-ink" href={salon.preciseGoogleMapUrl || `https://www.google.com/maps/search/?api=1&query=${salon.coordinates.lat},${salon.coordinates.lng}`} target="_blank" rel="noreferrer">
              <ExternalLink size={17} /> Open precise map
            </a>
          </div>
          <div className="mt-6">
            <CrowdIndicator crowd={salon.crowd} />
          </div>

          {activeOffers.length > 0 && (
            <div className="mt-8">
              <h2 className="font-display text-2xl font-black">Offers</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {activeOffers.map((offer, index) => (
                  <div key={offer._id || `${offer.title}-${index}`} className="rounded-xl border border-rose/20 bg-rose/10 p-4 shadow-glow">
                    <p className="text-xs font-black uppercase text-rose">{offer.type || 'Salon offer'}</p>
                    <p className="mt-1 text-lg font-black">{offer.title}</p>
                    <p className="mt-2 text-sm text-ink/70 dark:text-white/70">{offer.description || `${offer.discountPercent ? `${offer.discountPercent}% off` : offer.flatDiscount ? `Rs. ${offer.flatDiscount} off` : 'Special salon promotion'}${offer.code ? ` with code ${offer.code}` : ''}.`}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                      {offer.code && <span className="rounded-full bg-white px-3 py-1 text-ink dark:bg-ink dark:text-white">Code: {offer.code}</span>}
                      {offer.validUntil && <span className="rounded-full bg-gold/20 px-3 py-1 text-gold">Valid till {new Date(offer.validUntil).toLocaleDateString('en-IN')}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8">
            <h2 className="font-display text-2xl font-black">Featured stylists</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {salon.stylists.map((stylist) => (
                <div key={stylist._id} className="rounded-xl border border-white/10 bg-white/10 p-4 shadow-glow backdrop-blur-xl">
                  <img src={stylist.image} alt={stylist.name} className="h-24 w-24 rounded-full object-cover" />
                  <p className="mt-3 font-bold">{stylist.name}</p>
                  <p className="text-sm text-ink/60 dark:text-white/60">{stylist.title}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="font-display text-2xl font-black">Services</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {salon.services.slice(0, 12).map((service) => (
                <div key={service._id} className="rounded-lg border border-ink/10 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-bold">{service.name}</p>
                    <button type="button" aria-label={`${savedServices.has(service._id) ? 'Remove from wishlist' : 'Add to wishlist'} ${service.name}`} onClick={() => saveService(service)} className="focus-ring rounded-full p-2 text-rose hover:bg-rose/10">
                      <Heart size={17} fill={savedServices.has(service._id) ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  <p className="text-sm text-ink/60 dark:text-white/60">{service.category} / {service.durationMinutes} min / Rs. {service.price}</p>
                  <Button variant="secondary" className="mt-3" onClick={() => addService(service)}><ShoppingCart size={16} /> Add to cart</Button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="font-display text-2xl font-black">Reviews</h2>
            <p className="mt-3 rounded-md bg-rose/10 p-4 text-sm font-semibold text-rose">{aiSentimentSummary}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-5">{ratingDistribution.map((row) => <div key={row.rating} className="rounded-md bg-white p-3 text-center dark:bg-white/5"><p className="font-black">{row.rating} stars</p><p className="text-sm">{row.count}</p></div>)}</div>
            <div className="mt-4 space-y-3">{reviews.slice(0, 5).map((review) => <div key={review._id} className="rounded-md bg-white p-4 dark:bg-white/5"><p className="font-bold">{review.userName} / {review.rating} stars / Verified</p><p className="mt-1 text-sm text-ink/70 dark:text-white/70">{review.comment}</p></div>)}</div>
          </div>
          <iframe title="Google Map" src={mapSrc} className="mt-8 h-80 w-full rounded-xl border-0 shadow-glow" loading="lazy" />
        </div>
        <BookingFlow salon={salon} onToast={setToast} />
      </div>
    </section>
  );
}
