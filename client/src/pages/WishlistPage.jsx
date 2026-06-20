import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { fetchWishlist, moveWishlistServiceToCart, removeWishlistSalon, removeWishlistService } from '../api/client.js';
import { Button } from '../components/common/Button.jsx';
import { EmptyState, ErrorState, getLocalWishlist, LoadingState, money, moveLocalWishlistServiceToCart, removeLocalWishlistService } from './customerUtils.jsx';

export function WishlistPage() {
  const [data, setData] = useState({ salons: [], services: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      setData(await fetchWishlist());
    } catch (err) {
      setData(getLocalWishlist());
      setError('Using saved demo wishlist because the backend is offline.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function removeSalon(id) {
    await removeWishlistSalon(id);
    load();
  }

  async function removeService(id) {
    try {
      await removeWishlistService(id);
      load();
    } catch {
      setData(removeLocalWishlistService(id));
    }
  }

  async function moveToCart(id) {
    try {
      await moveWishlistServiceToCart(id);
      load();
    } catch {
      setData(moveLocalWishlistServiceToCart(id));
    }
  }

  if (loading) return <section className="section py-10"><LoadingState label="Loading wishlist" /></section>;
  const empty = !data.salons?.length && !data.services?.length;

  return (
    <section className="section py-10">
      <h1 className="flex items-center gap-2 font-display text-4xl font-black"><Heart className="text-rose" /> Wishlist</h1>
      <ErrorState message={error} />
      {empty ? <EmptyState title="Your wishlist is empty" body="Tap heart icons on salons or services to save them here." /> : (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-black">Saved Salons</h2>
            <div className="mt-4 space-y-3">
              {data.salons.map((salon) => (
                <div key={salon._id} className="flex gap-4 rounded-xl bg-white/10 p-4 shadow-glow">
                  <img src={salon.images?.[0]} alt="" className="h-20 w-24 rounded-md object-cover" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/salons/${salon.slug}`} className="font-black hover:text-rose">{salon.name}</Link>
                    <p className="text-sm text-ink/60 dark:text-white/60">{salon.locality} / {salon.rating} stars</p>
                  </div>
                  <Button variant="ghost" onClick={() => removeSalon(salon._id)}><Trash2 size={16} /></Button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-display text-2xl font-black">Saved Services</h2>
            <div className="mt-4 space-y-3">
              {data.services.map((service) => (
                <div key={`${service.salon}-${service.serviceId}`} className="rounded-xl bg-white/10 p-4 shadow-glow">
                  <p className="font-black">{service.name}</p>
                  <p className="text-sm text-ink/60 dark:text-white/60">{service.salonName} / {service.category} / {money(service.price)}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button onClick={() => moveToCart(service.serviceId)}><ShoppingCart size={16} /> Move to cart</Button>
                    <Button variant="ghost" onClick={() => removeService(service.serviceId)}><Trash2 size={16} /> Remove</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
