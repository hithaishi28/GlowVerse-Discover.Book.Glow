export function money(value) {
  return `Rs. ${Number(value || 0).toLocaleString('en-IN')}`;
}

export function EmptyState({ title, body }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/10 p-8 text-center shadow-glow backdrop-blur-xl">
      <p className="font-display text-2xl font-black">{title}</p>
      <p className="mt-2 text-sm text-ink/65 dark:text-white/65">{body}</p>
    </div>
  );
}

export function LoadingState({ label = 'Loading' }) {
  return <p className="rounded-md bg-white/10 p-4 text-sm font-bold text-ink/65 dark:text-white/65">{label}...</p>;
}

export function ErrorState({ message }) {
  if (!message) return null;
  return <p className="mb-4 rounded-md bg-rose/10 p-3 text-sm font-bold text-rose">{message}</p>;
}

const LOCAL_KEY = 'glowverse_local_customer_state';

function readLocalState() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '{"salons":[],"services":[],"cart":[]}');
  } catch {
    return { salons: [], services: [], cart: [] };
  }
}

function writeLocalState(next) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event('glowverse-local-customer-updated'));
  return next;
}

function totals(items = []) {
  const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
  const tax = Math.round(subtotal * 0.18);
  return { subtotal, tax, grandTotal: subtotal + tax };
}

function snapshot(salon, service) {
  return {
    _id: `${salon._id}-${service._id}`,
    serviceId: service._id,
    salon: salon._id,
    salonSlug: salon.slug,
    salonName: salon.name,
    name: service.name,
    category: service.category,
    price: Number(service.price || 0),
    quantity: 1
  };
}

export function getLocalWishlist() {
  const state = readLocalState();
  return { salons: state.salons || [], services: state.services || [] };
}

export function getLocalCart() {
  const state = readLocalState();
  const items = state.cart || [];
  return { items, totals: totals(items) };
}

export function getLocalOrders() {
  const state = readLocalState();
  return state.orders || [];
}

export function getLocalOffers(salonId) {
  const state = readLocalState();
  const offers = state.offers || [];
  if (!salonId) return offers;
  return offers.filter((offer) => offer.salonId === salonId || offer.salon === salonId);
}

export function saveLocalOffer(offer) {
  const state = readLocalState();
  const nextOffer = {
    _id: offer._id || `offer-local-${Date.now()}`,
    active: offer.active !== false,
    createdAt: new Date().toISOString(),
    ...offer
  };
  writeLocalState({ ...state, offers: [nextOffer, ...(state.offers || [])] });
  return nextOffer;
}

export function updateLocalOffer(offerId, patch) {
  const state = readLocalState();
  const offers = (state.offers || []).map((offer) => offer._id === offerId ? { ...offer, ...patch } : offer);
  writeLocalState({ ...state, offers });
  return offers.find((offer) => offer._id === offerId);
}

export function deleteLocalOffer(offerId) {
  const state = readLocalState();
  const offers = (state.offers || []).filter((offer) => offer._id !== offerId);
  writeLocalState({ ...state, offers });
  return offers;
}

export function toggleLocalWishlistService(salon, service) {
  const state = readLocalState();
  const serviceId = service._id;
  const exists = (state.services || []).some((item) => item.serviceId === serviceId && item.salon === salon._id);
  const services = exists
    ? state.services.filter((item) => !(item.serviceId === serviceId && item.salon === salon._id))
    : [...(state.services || []), snapshot(salon, service)];
  writeLocalState({ ...state, services });
  return { saved: !exists, services };
}

export function addLocalCartService(salon, service) {
  const state = readLocalState();
  const item = snapshot(salon, service);
  const cart = [...(state.cart || [])];
  const existing = cart.find((entry) => entry.serviceId === item.serviceId && entry.salon === item.salon);
  if (existing) existing.quantity = Number(existing.quantity || 1) + 1;
  else cart.push(item);
  writeLocalState({ ...state, cart });
  return getLocalCart();
}

export function updateLocalCartItem(itemId, quantity) {
  const state = readLocalState();
  const cart = (state.cart || [])
    .map((item) => item._id === itemId ? { ...item, quantity: Math.max(1, Number(quantity || 1)) } : item)
    .filter((item) => item.quantity > 0);
  writeLocalState({ ...state, cart });
  return getLocalCart();
}

export function removeLocalCartItem(itemId) {
  const state = readLocalState();
  writeLocalState({ ...state, cart: (state.cart || []).filter((item) => item._id !== itemId) });
  return getLocalCart();
}

export function clearLocalCart() {
  const state = readLocalState();
  writeLocalState({ ...state, cart: [] });
  return getLocalCart();
}

export function removeLocalWishlistService(serviceId) {
  const state = readLocalState();
  writeLocalState({ ...state, services: (state.services || []).filter((item) => item.serviceId !== serviceId) });
  return getLocalWishlist();
}

export function moveLocalWishlistServiceToCart(serviceId) {
  const state = readLocalState();
  const service = (state.services || []).find((item) => item.serviceId === serviceId);
  if (!service) return getLocalWishlist();
  const cart = [...(state.cart || [])];
  const existing = cart.find((item) => item.serviceId === service.serviceId && item.salon === service.salon);
  if (existing) existing.quantity = Number(existing.quantity || 1) + 1;
  else cart.push({ ...service, _id: `${service.salon}-${service.serviceId}`, quantity: 1 });
  const services = (state.services || []).filter((item) => item.serviceId !== serviceId);
  writeLocalState({ ...state, services, cart });
  return getLocalWishlist();
}

export function saveLocalOrderFromCart(paymentMethod = 'upi') {
  const state = readLocalState();
  const cart = state.cart || [];
  if (!cart.length) return null;
  const order = {
    _id: `order-${Date.now()}`,
    invoiceNumber: `GV-CART-${Date.now().toString().slice(-6)}`,
    salon: { name: cart[0].salonName, slug: cart[0].salonSlug },
    services: cart.map((item) => ({ name: item.name, price: item.price, quantity: item.quantity })),
    amount: totals(cart).grandTotal,
    paymentMethod,
    paymentStatus: 'Paid',
    status: 'confirmed',
    bookingDate: new Date().toISOString().slice(0, 10),
    appointmentDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  };
  const orders = [order, ...(state.orders || [])];
  writeLocalState({ ...state, cart: [], orders });
  return order;
}

export function saveLocalSalonBookingOrder({ user, salon, service, stylist, selected, amount, convenienceFee = 0, paymentMethod = 'upi' }) {
  const state = readLocalState();
  const stamp = Date.now();
  const transactionId = `UPI${String(stamp).slice(-10)}GV`;
  const order = {
    _id: `booking-${stamp}`,
    invoiceNumber: `GV-DEMO-${String(stamp).slice(-6)}`,
    user: {
      name: user?.name || 'GlowVerse Customer',
      email: user?.email || 'customer@glowverse.app',
      phone: user?.phone || ''
    },
    salon: {
      _id: salon?._id,
      name: salon?.name || 'GlowVerse Salon',
      slug: salon?.slug,
      address: salon?.address
    },
    service: service ? { ...service } : { name: 'Salon service', price: amount },
    stylist: stylist ? { ...stylist } : { name: 'Any available stylist' },
    services: [{ name: service?.name || 'Salon service', price: Number(service?.price || amount || 0), quantity: 1 }],
    amount: Number(amount || 0),
    convenienceFee: Number(convenienceFee || 0),
    paymentMethod,
    paymentStatus: 'Paid',
    status: 'confirmed',
    bookingDate: new Date().toISOString().slice(0, 10),
    appointmentDate: selected?.date || new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    date: selected?.date || new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    slot: selected?.slot || '10:00 AM',
    transactionId,
    payment: {
      _id: `pay-${stamp}`,
      transactionId,
      providerPaymentId: transactionId,
      method: paymentMethod,
      status: 'paid',
      amount: Number(amount || 0),
      paidAt: new Date().toISOString()
    }
  };
  const orders = [order, ...(state.orders || [])];
  writeLocalState({ ...state, orders });
  return order;
}
