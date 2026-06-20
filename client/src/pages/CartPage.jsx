import { useEffect, useState } from 'react';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { clearCart, fetchCart, removeCartItem, updateCartItem } from '../api/client.js';
import { Button } from '../components/common/Button.jsx';
import { clearLocalCart, EmptyState, ErrorState, getLocalCart, LoadingState, money, removeLocalCartItem, updateLocalCartItem } from './customerUtils.jsx';

export function CartPage() {
  const [cart, setCart] = useState({ items: [], totals: { subtotal: 0, tax: 0, grandTotal: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      setCart(await fetchCart());
    } catch (err) {
      setCart(getLocalCart());
      setError('Using saved demo cart because the backend is offline.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function setQty(id, quantity) {
    try {
      setCart(await updateCartItem(id, quantity));
    } catch {
      setCart(updateLocalCartItem(id, quantity));
    }
  }

  async function removeItem(id) {
    try {
      setCart(await removeCartItem(id));
    } catch {
      setCart(removeLocalCartItem(id));
    }
  }

  async function emptyCart() {
    try {
      setCart(await clearCart());
    } catch {
      setCart(clearLocalCart());
    }
  }

  if (loading) return <section className="section py-10"><LoadingState label="Loading cart" /></section>;

  return (
    <section className="section py-10">
      <h1 className="flex items-center gap-2 font-display text-4xl font-black"><ShoppingCart className="text-rose" /> Cart</h1>
      <ErrorState message={error} />
      {!cart.items?.length ? <EmptyState title="Your cart is empty" body="Add services from salon pages to plan your appointment." /> : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            {cart.items.map((item) => (
              <div key={item._id} className="rounded-xl bg-white/10 p-4 shadow-glow">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{item.name}</p>
                    <p className="text-sm text-ink/60 dark:text-white/60">{item.salonName} / {item.category} / {money(item.price)}</p>
                  </div>
                  <Button variant="ghost" onClick={() => removeItem(item._id)}><Trash2 size={16} /></Button>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Button variant="secondary" onClick={() => setQty(item._id, Number(item.quantity) - 1)}>-</Button>
                  <span className="min-w-10 text-center font-black">{item.quantity}</span>
                  <Button variant="secondary" onClick={() => setQty(item._id, Number(item.quantity) + 1)}>+</Button>
                  <span className="ml-auto font-black">{money(Number(item.price) * Number(item.quantity))}</span>
                </div>
              </div>
            ))}
          </div>
          <aside className="rounded-xl bg-white/10 p-5 shadow-glow">
            <p className="font-display text-2xl font-black">Summary</p>
            <div className="mt-4 space-y-2 text-sm">
              <p className="flex justify-between"><span>Subtotal</span><strong>{money(cart.totals.subtotal)}</strong></p>
              <p className="flex justify-between"><span>GST</span><strong>{money(cart.totals.tax)}</strong></p>
              <p className="flex justify-between text-lg"><span>Grand Total</span><strong>{money(cart.totals.grandTotal)}</strong></p>
            </div>
            <Button className="mt-5 w-full" onClick={() => window.location.assign('/client/checkout')}>Proceed to Checkout</Button>
            <Button variant="ghost" className="mt-2 w-full" onClick={emptyCart}>Clear cart</Button>
          </aside>
        </div>
      )}
    </section>
  );
}
