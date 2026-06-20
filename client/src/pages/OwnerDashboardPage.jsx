import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { BarChart, CalendarDays, CreditCard, Download, FileText, Image, Megaphone, MessageSquareText, Package, Scissors, Star, Store, Users } from 'lucide-react';
import { Bar, BarChart as ReBarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { jsPDF } from 'jspdf';
import {
  api,
  createInventoryItem,
  createOwnerOffer,
  createOwnerService,
  createOwnerStylist,
  deleteInventoryItem,
  deleteOwnerOffer,
  deleteOwnerService,
  deleteOwnerStylist,
  fetchOwnerWorkspace,
  replyToReview,
  reportReview,
  updateInventoryItem,
  updateOwnerBookingStatus,
  updateOwnerOffer,
  updateOwnerSalon,
  updateOwnerSalonPhotos,
  updateOwnerService,
  updateOwnerStylist
} from '../api/client.js';
import { Button } from '../components/common/Button.jsx';
import { PortalSalonSearch } from '../components/PortalSalonSearch.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { buildInvoiceData, downloadInvoicePdf } from '../utils/invoice.js';
import { deleteLocalOffer, getLocalOffers, getLocalOrders, saveLocalOffer, updateLocalOffer } from './customerUtils.jsx';

const modules = [
  ['profile', 'Salon profile', Store],
  ['photos', 'Photos & cover', Image],
  ['services', 'Service CRUD', Scissors],
  ['staff', 'Staff CRUD', Users],
  ['appointments', 'Bookings', CalendarDays],
  ['calendar', 'Calendar view', CalendarDays],
  ['customers', 'Customers', Users],
  ['payments', 'Payments', CreditCard],
  ['invoices', 'Invoices', FileText],
  ['promotions', 'Offers', Megaphone],
  ['inventory', 'Inventory', Package],
  ['reviews', 'Reviews', Star],
  ['revenue', 'Revenue', BarChart],
  ['reports', 'Reports', Download]
];

const emptyData = {
  metrics: { todayBookings: 0, totalStylists: 0, totalRevenue: 0 },
  editable: { salons: [], services: [], staff: [], bookings: [], payments: [], reviews: [], offers: [], inventory: [] },
  customers: [],
  invoices: [],
  revenue: [],
  occupancy: null
};

const demoSalon = {
  _id: 'demo-owner-salon',
  name: 'LuxeGlow Studio Indiranagar',
  address: '12, 100 Feet Road, Indiranagar, Bengaluru',
  contact: { phone: '+91 98765 44120', email: 'owner@luxeglow.example' },
  workingHours: { open: '09:00', close: '21:00' },
  images: ['https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80'],
  coverImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80'
};

const ownerDemoData = {
  source: 'demo',
  metrics: { todayBookings: 18, totalStylists: 5, totalRevenue: 284600 },
  editable: {
    salons: [demoSalon],
    services: [
      { _id: 'svc-1', salonId: demoSalon._id, salonName: demoSalon.name, name: 'Keratin Smoothening', category: 'Hair', price: 6200, durationMinutes: 150 },
      { _id: 'svc-2', salonId: demoSalon._id, salonName: demoSalon.name, name: 'Hydra Glow Facial', category: 'Skin', price: 3400, durationMinutes: 60 },
      { _id: 'svc-3', salonId: demoSalon._id, salonName: demoSalon.name, name: 'Bridal HD Makeup', category: 'Makeup', price: 12500, durationMinutes: 180 }
    ],
    staff: [
      { _id: 'sty-1', salonId: demoSalon._id, salonName: demoSalon.name, name: 'Meera Kapoor', title: 'Senior Hair Artist', rating: 4.9 },
      { _id: 'sty-2', salonId: demoSalon._id, salonName: demoSalon.name, name: 'Ayesha Rao', title: 'Skin Therapist', rating: 4.8 },
      { _id: 'sty-3', salonId: demoSalon._id, salonName: demoSalon.name, name: 'Rohan Bhat', title: 'Makeup Lead', rating: 4.7 }
    ],
    bookings: [
      { _id: 'book-1', invoiceNumber: 'GV-LUX-1001', user: { name: 'Anjana M', email: 'anjana@example.com' }, salon: demoSalon, service: { name: 'Hydra Glow Facial' }, stylist: { name: 'Ayesha Rao' }, date: '2026-06-20', slot: '11:30 AM', status: 'confirmed', amount: 3400 },
      { _id: 'book-2', invoiceNumber: 'GV-LUX-1002', user: { name: 'Priya Nair', email: 'priya@example.com' }, salon: demoSalon, service: { name: 'Keratin Smoothening' }, stylist: { name: 'Meera Kapoor' }, date: '2026-06-20', slot: '02:30 PM', status: 'completed', amount: 6200 },
      { _id: 'book-3', invoiceNumber: 'GV-LUX-1003', user: { name: 'Kavya S', email: 'kavya@example.com' }, salon: demoSalon, service: { name: 'Bridal HD Makeup' }, stylist: { name: 'Rohan Bhat' }, date: '2026-06-21', slot: '10:00 AM', status: 'pending_payment', amount: 12500 }
    ],
    payments: [
      { _id: 'pay-1', booking: 'book-1', method: 'UPI', status: 'paid', amount: 3400, paidAt: '2026-06-20 11:10 AM', transactionId: 'pay_LUX1001' },
      { _id: 'pay-2', booking: 'book-2', method: 'Card', status: 'paid', amount: 6200, paidAt: '2026-06-20 02:05 PM', transactionId: 'pay_LUX1002' }
    ],
    reviews: [
      { _id: 'rev-1', salon: demoSalon, userName: 'Anjana M', rating: 5, status: 'published', ownerReply: { text: 'Thank you, Anjana. See you again soon!' } },
      { _id: 'rev-2', salon: demoSalon, userName: 'Priya Nair', rating: 4, status: 'published', ownerReply: { text: '' } }
    ],
    offers: [
      { _id: 'off-1', title: 'Weekend Glow Combo', type: 'combo', code: 'GLOW20', active: true, validUntil: '2026-07-05' },
      { _id: 'off-2', title: 'First Facial 15%', type: 'first_time', code: 'FIRST15', active: true, validUntil: '2026-06-30' }
    ],
    inventory: [
      { _id: 'inv-1', name: 'Keratin Kit', quantity: 8, lowStockThreshold: 5, supplier: 'BeautyPro' },
      { _id: 'inv-2', name: 'Hydra Serum', quantity: 3, lowStockThreshold: 6, supplier: 'SkinLab' }
    ]
  },
  customers: [
    { id: 'cus-1', name: 'Anjana M', email: 'anjana@example.com', phone: '+91 90000 11111', totalOrders: 4, totalSpend: 'Rs. 18,400' },
    { id: 'cus-2', name: 'Priya Nair', email: 'priya@example.com', phone: '+91 90000 22222', totalOrders: 6, totalSpend: 'Rs. 31,200' },
    { id: 'cus-3', name: 'Kavya S', email: 'kavya@example.com', phone: '+91 90000 33333', totalOrders: 2, totalSpend: 'Rs. 14,900' }
  ],
  revenue: [{ day: 'Mon', revenue: 38000 }, { day: 'Tue', revenue: 42000 }, { day: 'Wed', revenue: 52000 }, { day: 'Thu', revenue: 46000 }, { day: 'Fri', revenue: 61000 }, { day: 'Sat', revenue: 82000 }],
  occupancy: { occupancy: 68, availableSlots: 12, todayBookings: 18, crowd: { level: 'Busy' } }
};

const bookingStatusActions = [
  ['pending_payment', 'Pending'],
  ['confirmed', 'Confirm'],
  ['rescheduled', 'Reschedule'],
  ['completed', 'Complete'],
  ['cancelled', 'Cancel']
];

function localOrdersAsBookings() {
  return getLocalOrders().map((order) => ({
    ...order,
    _id: order._id,
    invoiceNumber: order.invoiceNumber,
    user: order.user || { name: 'GlowVerse Customer' },
    salon: order.salon || demoSalon,
    service: order.service || { name: order.services?.[0]?.name || 'Salon service', price: order.amount },
    stylist: order.stylist || { name: 'Assigned stylist' },
    date: order.date || order.appointmentDate,
    slot: order.slot || '10:00 AM',
    status: order.status || 'confirmed',
    amount: order.amount || 0
  }));
}

function withLocalOwnerOrders(source) {
  const localBookings = localOrdersAsBookings();
  const localOffers = getLocalOffers();
  if (!localBookings.length && !localOffers.length) return source;
  const existingIds = new Set((source.editable?.bookings || []).map((item) => item._id));
  const mergedBookings = [...localBookings.filter((item) => !existingIds.has(item._id)), ...(source.editable?.bookings || [])];
  const existingOfferIds = new Set((source.editable?.offers || []).map((item) => item._id));
  const mergedOffers = [...localOffers.filter((item) => !existingOfferIds.has(item._id)), ...(source.editable?.offers || [])];
  const localPayments = localBookings.map((booking) => ({
    ...(booking.payment || {}),
    _id: booking.payment?._id || `pay-${booking._id}`,
    booking: booking._id,
    method: booking.paymentMethod || booking.payment?.method || 'upi',
    status: 'paid',
    amount: booking.amount,
    paidAt: booking.payment?.paidAt || new Date().toISOString()
  }));
  return {
    ...source,
    metrics: {
      ...(source.metrics || {}),
      todayBookings: mergedBookings.length,
      totalRevenue: mergedBookings.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    },
    editable: {
      ...(source.editable || {}),
      bookings: mergedBookings,
      payments: [...localPayments, ...(source.editable?.payments || [])],
      offers: mergedOffers
    }
  };
}

function readFilesAsDataUrls(files) {
  return Promise.all(Array.from(files || []).map((file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  })));
}

function val(form, key) {
  return form.get(key)?.toString().trim();
}

function OwnerTable({ rows, actions }) {
  if (!rows?.length) return <p className="rounded-md bg-white/10 p-4 text-sm font-bold">No records found.</p>;
  const headers = Object.keys(rows[0]).filter((header) => !header.startsWith('_') && header !== 'raw');
  return (
    <div className="overflow-auto rounded-lg border border-white/10">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-ink text-white dark:bg-white dark:text-ink"><tr>{headers.map((header) => <th key={header} className="px-4 py-3 capitalize">{header}</th>)}{actions && <th className="px-4 py-3">Actions</th>}</tr></thead>
        <tbody>{rows.map((row) => (
          <tr key={row._id || row.id || row.invoice} className="border-t border-white/10">
            {headers.map((header) => <td key={header} className="px-4 py-3">{String(row[header] ?? '')}</td>)}
            {actions && <td className="px-4 py-3"><ActionDropdown>{actions(row)}</ActionDropdown></td>}
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function ActionDropdown({ children }) {
  return (
    <details className="group w-44">
      <summary className="focus-ring flex cursor-pointer list-none items-center justify-between rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm font-black hover:bg-white/15">
        Actions <span className="transition group-open:rotate-180">v</span>
      </summary>
      <div className="mt-2 grid gap-2 rounded-md border border-white/10 bg-ink/95 p-2 text-white shadow-glow [&_button]:w-full [&_button]:justify-start [&_button]:!border-white/10 [&_button]:!bg-white/10 [&_button]:!text-white hover:[&_button]:!bg-white/15">
        {children}
      </div>
    </details>
  );
}

function Field({ name, placeholder, type = 'text', defaultValue = '', required = false }) {
  return <input name={name} type={type} placeholder={placeholder} defaultValue={defaultValue} required={required} className="focus-ring h-11 rounded-md border border-white/10 bg-white/10 px-3 text-sm" />;
}

export function OwnerDashboardPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialModule = modules.some(([key]) => key === searchParams.get('module')) ? searchParams.get('module') : 'appointments';
  const [active, setActive] = useState(initialModule);
  const [data, setData] = useState(emptyData);
  const [connectionState, setConnectionState] = useState('loading');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [photoDraft, setPhotoDraft] = useState({ coverImage: '', images: '' });
  const outputRef = useRef(null);
  const selectedSalon = data.editable?.salons?.[0];

  useEffect(() => {
    if (!selectedSalon) return;
    setPhotoDraft({
      coverImage: selectedSalon.coverImage || selectedSalon.images?.[0] || '',
      images: (selectedSalon.images || []).join('\n')
    });
  }, [selectedSalon?._id]);

  async function load() {
    try {
      const payload = await fetchOwnerWorkspace();
      setData({ ...emptyData, ...payload, editable: { ...emptyData.editable, ...(payload.editable || {}) } });
      setConnectionState('live');
    } catch {
      setData(withLocalOwnerOrders(ownerDemoData));
      setConnectionState('offline');
    }
  }

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 15000);
    window.addEventListener('focus', load);
    window.addEventListener('glowverse-local-customer-updated', load);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', load);
      window.removeEventListener('glowverse-local-customer-updated', load);
    };
  }, []);

  const summary = useMemo(() => ({
    bookings: data.metrics?.todayBookings || 0,
    staff: data.metrics?.totalStylists || 0,
    revenue: data.metrics?.totalRevenue || 0,
    reviews: data.editable?.reviews?.length || 0
  }), [data]);

  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === 'user') return <Navigate to="/client/dashboard" replace />;

  async function run(action, ok = 'Saved', localAction) {
    setBusy(true);
    setMessage('');
    if (connectionState === 'offline') {
      localAction?.();
      setMessage(`${ok} in demo preview`);
      setBusy(false);
      return;
    }
    try {
      await action();
      setMessage(ok);
      await load();
    } catch (error) {
      if (connectionState === 'offline') setMessage(`${ok} in demo preview`);
      else setMessage(error.response?.data?.message || error.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  }

  function openModule(key) {
    setActive(key);
    window.setTimeout(() => outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  async function exportCsv() {
    let blob;
    try {
      const response = await api.get('/management/owner/reports/business?format=csv', { responseType: 'blob' });
      blob = response.data;
    } catch {
      blob = new Blob(['section,id,name,amount\nbooking,GV-LUX-1001,Anjana M,3400\nbooking,GV-LUX-1002,Priya Nair,6200'], { type: 'text/csv' });
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'owner-business-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPdf() {
    const doc = new jsPDF();
    doc.text('GlowVerse Owner Business Report', 20, 20);
    doc.text(`Revenue: Rs. ${Number(summary.revenue || 0).toLocaleString('en-IN')}`, 20, 35);
    doc.text(`Bookings today: ${summary.bookings}`, 20, 48);
    doc.text(`Staff: ${summary.staff}`, 20, 61);
    doc.save('owner-business-report.pdf');
  }

  async function invoicePdf(booking) {
    const payment = data.editable.payments.find((item) => String(item.booking) === String(booking._id));
    const salon = booking.salon || selectedSalon || {};
    const invoice = buildInvoiceData({ user: booking.user || {}, salon, booking, payment, service: booking.service, stylist: booking.stylist, selected: { date: booking.date, slot: booking.slot }, total: booking.amount });
    await downloadInvoicePdf(invoice);
  }

  const bookingRows = (data.editable.bookings || []).map((booking) => ({
    _id: booking._id,
    customer: booking.user?.name || 'Customer',
    salon: booking.salon?.name || selectedSalon?.name || 'Salon',
    service: booking.service?.name,
    date: booking.date,
    slot: booking.slot,
    status: booking.status,
    amount: `Rs. ${booking.amount || 0}`,
    raw: booking
  }));
  const serviceRows = (data.editable.services || []).map((item) => ({ _id: item._id, salonId: item.salonId, salon: item.salonName, name: item.name, category: item.category, price: item.price, duration: item.durationMinutes }));
  const staffRows = (data.editable.staff || []).map((item) => ({ _id: item._id, salonId: item.salonId, salon: item.salonName, name: item.name, title: item.title, rating: item.rating }));
  const offerRows = (data.editable.offers || []).map((item) => ({ _id: item._id, title: item.title, type: item.type, code: item.code, active: item.active, validUntil: item.validUntil ? new Date(item.validUntil).toLocaleDateString() : '-' }));
  const inventoryRows = (data.editable.inventory || []).map((item) => ({ _id: item._id, name: item.name, quantity: item.quantity, threshold: item.lowStockThreshold, alert: Number(item.quantity) <= Number(item.lowStockThreshold) ? 'Low stock' : 'OK' }));
  const reviewRows = (data.editable.reviews || []).map((item) => ({ _id: item._id, salon: item.salon?.name, customer: item.userName, rating: item.rating, status: item.status, reply: item.ownerReply?.text || '' }));

  return (
    <section className="section py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-black">Salon Owner Dashboard</h1>
          <p className="mt-2 text-sm text-ink/65 dark:text-white/65">Manage salon profile, services, staff, bookings, revenue, offers, inventory, reviews, invoices, and reports.</p>
          {connectionState !== 'live' && <p className="mt-2 rounded-md bg-gold/15 px-3 py-2 text-sm font-bold text-gold">Backend owner data is unavailable. Start backend + MongoDB for live management.</p>}
          {message && <p className="mt-2 rounded-md bg-sage/15 px-3 py-2 text-sm font-bold text-sage">{message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <div className="rounded-lg bg-white/10 p-3"><p className="font-black">{summary.bookings}</p><p className="text-ink/55 dark:text-white/55">Bookings</p></div>
          <div className="rounded-lg bg-white/10 p-3"><p className="font-black">{summary.staff}</p><p className="text-ink/55 dark:text-white/55">Staff</p></div>
          <div className="rounded-lg bg-white/10 p-3"><p className="font-black">Rs. {summary.revenue.toLocaleString('en-IN')}</p><p className="text-ink/55 dark:text-white/55">Revenue</p></div>
          <div className="rounded-lg bg-white/10 p-3"><p className="font-black">{summary.reviews}</p><p className="text-ink/55 dark:text-white/55">Reviews</p></div>
        </div>
      </div>

      <div className="mt-5">
        <PortalSalonSearch title="Owner quick salon search" compact />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {modules.map(([key, title, Icon]) => (
          <button key={key} type="button" onClick={() => openModule(key)} className={`focus-ring rounded-lg border p-5 text-left transition ${active === key ? 'border-rose bg-rose text-white' : 'border-white/10 bg-white/10 hover:bg-white/15'}`}>
            <Icon size={24} /><h2 className="mt-4 text-lg font-black">{title}</h2>
          </button>
        ))}
      </div>

      <div ref={outputRef} className="mt-6 scroll-mt-24 rounded-xl border border-white/10 bg-white/10 p-5 shadow-glow backdrop-blur-xl">
        <h2 className="mb-4 flex items-center gap-2 font-display text-2xl font-black"><MessageSquareText className="text-rose" /> {modules.find(([key]) => key === active)?.[1]}</h2>

        {active === 'profile' && selectedSalon && (
          <form className="grid gap-3 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); run(() => updateOwnerSalon(selectedSalon._id, { name: val(form, 'name'), address: val(form, 'address'), contact: { phone: val(form, 'phone'), email: val(form, 'email') }, workingHours: { open: val(form, 'open'), close: val(form, 'close') } })); }}>
            <Field name="name" placeholder="Salon name" defaultValue={selectedSalon.name} required /><Field name="address" placeholder="Address" defaultValue={selectedSalon.address} />
            <Field name="phone" placeholder="Phone" defaultValue={selectedSalon.contact?.phone} /><Field name="email" placeholder="Email" defaultValue={selectedSalon.contact?.email} />
            <Field name="open" placeholder="Open HH:MM" defaultValue={selectedSalon.workingHours?.open} /><Field name="close" placeholder="Close HH:MM" defaultValue={selectedSalon.workingHours?.close} />
            <Button disabled={busy} type="submit">Save profile</Button>
          </form>
        )}

        {active === 'photos' && selectedSalon && (
          <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); const payload = { coverImage: photoDraft.coverImage, images: photoDraft.images.split('\n').map((item) => item.trim()).filter(Boolean) }; run(() => updateOwnerSalonPhotos(selectedSalon._id, payload), 'Photos saved', () => setData((current) => ({ ...current, editable: { ...current.editable, salons: (current.editable.salons || []).map((item) => item._id === selectedSalon._id ? { ...item, ...payload } : item) } }))); }}>
            <input name="coverImage" placeholder="Cover image URL" value={photoDraft.coverImage} onChange={(event) => setPhotoDraft((current) => ({ ...current, coverImage: event.target.value }))} className="focus-ring h-11 rounded-md border border-white/10 bg-white/10 px-3 text-sm" />
            <label className="rounded-md border border-dashed border-white/20 bg-white/10 p-4 text-sm font-bold">
              Choose cover image from device
              <input type="file" accept="image/*" className="mt-3 block w-full text-sm" onChange={async (event) => { const [image] = await readFilesAsDataUrls(event.target.files); if (image) setPhotoDraft((current) => ({ ...current, coverImage: image })); }} />
            </label>
            <textarea name="images" className="focus-ring min-h-32 rounded-md border border-white/10 bg-white/10 p-3 text-sm" value={photoDraft.images} onChange={(event) => setPhotoDraft((current) => ({ ...current, images: event.target.value }))} />
            <label className="rounded-md border border-dashed border-white/20 bg-white/10 p-4 text-sm font-bold">
              Add gallery images from device
              <input type="file" accept="image/*" multiple className="mt-3 block w-full text-sm" onChange={async (event) => { const images = await readFilesAsDataUrls(event.target.files); if (images.length) setPhotoDraft((current) => ({ ...current, images: [current.images, ...images].filter(Boolean).join('\n') })); }} />
            </label>
            <Button disabled={busy} type="submit">Save photos and order</Button>
          </form>
        )}

        {active === 'services' && selectedSalon && (
          <>
            <form className="mb-4 grid gap-3 md:grid-cols-5" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const draft = { _id: `svc-local-${Date.now()}`, salonId: selectedSalon._id, salonName: selectedSalon.name, name: val(form, 'name'), category: val(form, 'category'), price: Number(val(form, 'price')), durationMinutes: Number(val(form, 'durationMinutes')), description: val(form, 'description') }; run(() => createOwnerService(selectedSalon._id, draft), 'Service created', () => setData((current) => ({ ...current, editable: { ...current.editable, services: [draft, ...(current.editable.services || [])] } }))); event.currentTarget.reset(); }}>
              <Field name="name" placeholder="Service name" required /><Field name="category" placeholder="Category" required /><Field name="price" placeholder="Price" type="number" required /><Field name="durationMinutes" placeholder="Minutes" type="number" required /><Field name="description" placeholder="Description" />
              <Button disabled={busy} type="submit">Add service</Button>
            </form>
            <OwnerTable rows={serviceRows} actions={(row) => <><Button variant="secondary" onClick={() => { const price = window.prompt('Updated service price', row.price); if (price !== null) run(() => updateOwnerService(row.salonId, row._id, { price }), 'Service updated', () => setData((current) => ({ ...current, editable: { ...current.editable, services: (current.editable.services || []).map((item) => item._id === row._id ? { ...item, price: Number(price) } : item) } }))); }}>Edit price</Button><Button variant="ghost" onClick={() => run(() => deleteOwnerService(row.salonId, row._id), 'Service deleted', () => setData((current) => ({ ...current, editable: { ...current.editable, services: (current.editable.services || []).filter((item) => item._id !== row._id) } })))}>Delete</Button></>} />
          </>
        )}

        {active === 'staff' && selectedSalon && (
          <>
            <form className="mb-4 grid gap-3 md:grid-cols-5" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); run(() => createOwnerStylist(selectedSalon._id, { name: val(form, 'name'), title: val(form, 'title'), rating: val(form, 'rating'), image: val(form, 'image'), experienceYears: val(form, 'experienceYears') }), 'Staff created'); event.currentTarget.reset(); }}>
              <Field name="name" placeholder="Stylist name" required /><Field name="title" placeholder="Role" required /><Field name="rating" placeholder="Rating" type="number" /><Field name="experienceYears" placeholder="Years" type="number" /><Field name="image" placeholder="Photo URL" />
              <Button disabled={busy} type="submit">Add staff</Button>
            </form>
            <OwnerTable rows={staffRows} actions={(row) => <><Button variant="secondary" onClick={() => { const rating = window.prompt('Updated stylist rating', row.rating); if (rating !== null) run(() => updateOwnerStylist(row.salonId, row._id, { rating }), 'Staff updated'); }}>Edit rating</Button><Button variant="ghost" onClick={() => run(() => deleteOwnerStylist(row.salonId, row._id), 'Staff deleted')}>Delete</Button></>} />
          </>
        )}

        {active === 'appointments' && <OwnerTable rows={bookingRows} actions={(row) => <>{bookingStatusActions.map(([status, label]) => <Button key={status} variant="secondary" onClick={() => run(() => updateOwnerBookingStatus(row._id, status), `Booking marked ${status}`, () => setData((current) => ({ ...current, editable: { ...current.editable, bookings: (current.editable.bookings || []).map((item) => item._id === row._id ? { ...item, status } : item) } })))}>{label}</Button>)}</>} />}
        {active === 'calendar' && <OwnerTable rows={bookingRows.map((row) => ({ date: row.date, slot: row.slot, customer: row.customer, service: row.service, status: row.status }))} />}
        {active === 'customers' && <OwnerTable rows={data.customers || []} />}
        {active === 'payments' && <OwnerTable rows={(data.editable.payments || []).map((item) => ({ id: item._id, method: item.method, status: item.status, amount: item.amount, paidAt: item.paidAt || '-' }))} />}
        {active === 'invoices' && <OwnerTable rows={bookingRows.filter((row) => row.raw.invoiceNumber).map((row) => ({ ...row, invoice: row.raw.invoiceNumber }))} actions={(row) => <Button onClick={() => invoicePdf(row.raw)}><FileText size={15} /> PDF</Button>} />}
        {active === 'promotions' && selectedSalon && (
          <>
            <form className="mb-4 grid gap-3 md:grid-cols-6" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const draft = { _id: `offer-local-${Date.now()}`, salonId: selectedSalon._id, salonName: selectedSalon.name, title: val(form, 'title'), type: val(form, 'type'), code: val(form, 'code'), discountPercent: Number(val(form, 'discountPercent') || 0), flatDiscount: Number(val(form, 'flatDiscount') || 0), validUntil: val(form, 'validUntil'), active: true }; run(() => createOwnerOffer(selectedSalon._id, draft), 'Offer created', () => { const saved = saveLocalOffer(draft); setData((current) => ({ ...current, editable: { ...current.editable, offers: [saved, ...(current.editable.offers || []).filter((item) => item._id !== saved._id)] } })); }); event.currentTarget.reset(); }}>
              <Field name="title" placeholder="Offer title" required /><select name="type" className="focus-ring h-11 rounded-md border border-white/10 bg-white/10 px-3 text-sm"><option value="percentage">Percentage</option><option value="flat">Flat</option><option value="seasonal">Seasonal</option><option value="festival">Festival</option><option value="membership">Membership</option><option value="combo">Combo</option><option value="referral">Referral</option><option value="limited_time">Limited-time</option></select>
              <Field name="code" placeholder="Code" /><Field name="discountPercent" placeholder="% off" type="number" /><Field name="flatDiscount" placeholder="Flat off" type="number" /><Field name="validUntil" placeholder="Valid until" type="date" />
              <Button disabled={busy} type="submit">Create offer</Button>
            </form>
            <OwnerTable rows={offerRows} actions={(row) => <><Button variant="secondary" onClick={() => run(() => updateOwnerOffer(row._id, { active: row.active !== true }), 'Offer updated', () => { const updated = updateLocalOffer(row._id, { active: row.active !== true }); setData((current) => ({ ...current, editable: { ...current.editable, offers: (current.editable.offers || []).map((item) => item._id === row._id ? { ...item, ...(updated || { active: row.active !== true }) } : item) } })); })}>Toggle</Button><Button variant="ghost" onClick={() => run(() => deleteOwnerOffer(row._id), 'Offer deleted', () => { deleteLocalOffer(row._id); setData((current) => ({ ...current, editable: { ...current.editable, offers: (current.editable.offers || []).filter((item) => item._id !== row._id) } })); })}>Delete</Button></>} />
          </>
        )}
        {active === 'inventory' && selectedSalon && (
          <>
            <form className="mb-4 grid gap-3 md:grid-cols-5" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); run(() => createInventoryItem(selectedSalon._id, { name: val(form, 'name'), category: val(form, 'category'), quantity: val(form, 'quantity'), lowStockThreshold: val(form, 'lowStockThreshold'), supplier: val(form, 'supplier') }), 'Inventory item created'); event.currentTarget.reset(); }}>
              <Field name="name" placeholder="Item name" required /><Field name="category" placeholder="Category" /><Field name="quantity" placeholder="Quantity" type="number" /><Field name="lowStockThreshold" placeholder="Low stock" type="number" /><Field name="supplier" placeholder="Supplier" />
              <Button disabled={busy} type="submit">Add item</Button>
            </form>
            <OwnerTable rows={inventoryRows} actions={(row) => <><Button variant="secondary" onClick={() => run(() => updateInventoryItem(row._id, { quantity: Number(row.quantity) + 1 }), 'Inventory updated')}>+1</Button><Button variant="ghost" onClick={() => run(() => deleteInventoryItem(row._id), 'Inventory deleted')}>Delete</Button></>} />
          </>
        )}
        {active === 'reviews' && <OwnerTable rows={reviewRows} actions={(row) => <><Button variant="secondary" onClick={() => run(() => replyToReview(row._id, window.prompt('Reply to review') || ''), 'Reply saved')}>Reply</Button><Button variant="ghost" onClick={() => run(() => reportReview(row._id, 'Owner reported review'), 'Review reported')}>Report</Button></>} />}
        {active === 'revenue' && <div className="h-80"><ResponsiveContainer width="100%" height="100%"><ReBarChart data={data.revenue || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" /><YAxis /><Tooltip /><Bar dataKey="revenue" fill="#be3455" /></ReBarChart></ResponsiveContainer></div>}
        {active === 'reports' && <div className="flex flex-wrap gap-3"><Button onClick={exportCsv}><Download size={16} /> Export Excel CSV</Button><Button variant="secondary" onClick={exportPdf}><FileText size={16} /> Export PDF</Button></div>}
        {active === 'occupancy' && <pre className="overflow-auto rounded-lg bg-white/10 p-4 text-sm">{JSON.stringify(data.occupancy || {}, null, 2)}</pre>}
      </div>
    </section>
  );
}
