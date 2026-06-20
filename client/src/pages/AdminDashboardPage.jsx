import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  Image as ImageIcon,
  Megaphone,
  MessageSquareText,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Store,
  Tags,
  Ticket,
  UsersRound
} from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { jsPDF } from 'jspdf';
import {
  adminDeleteBanner,
  adminDeleteCategory,
  adminDeleteSalon,
  adminDeleteUser,
  adminModerateReview,
  adminModerateSalon,
  adminSendAnnouncement,
  adminUpdateBookingStatus,
  adminUpdateSettings,
  adminUpdateTicket,
  adminUpdateUser,
  adminUpsertBanner,
  adminUpsertCategory,
  api,
  fetchAdminWorkspace
} from '../api/client.js';
import { Button } from '../components/common/Button.jsx';
import { PortalSalonSearch } from '../components/PortalSalonSearch.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getLocalOrders } from './customerUtils.jsx';

const fallbackAnalytics = {
  source: 'demo',
  metrics: { totalUsers: 842, totalSalons: 36, approvedSalons: 29, totalBookings: 1284, totalRevenue: 1845600, totalCommission: 221472 },
  revenueForecast: [{ month: 'Jan', revenue: 220000 }, { month: 'Feb', revenue: 310000 }, { month: 'Mar', revenue: 420000 }, { month: 'Apr', revenue: 510000 }, { month: 'May', revenue: 590000 }, { month: 'Jun', revenue: 690000 }],
  popularServices: [{ name: 'Hair Cut', bookings: 280 }, { name: 'Facial', bookings: 218 }, { name: 'Makeup', bookings: 142 }, { name: 'Spa', bookings: 96 }],
  users: [],
  salonApprovals: [],
  reviews: [],
  bookings: [],
  payments: [],
  memberships: [],
  editable: {
    users: [
      { _id: 'adm-user-1', name: 'Anjana M', email: 'anjana@example.com', phone: '+91 90000 11111', role: 'user', status: 'active', createdAt: '2026-06-18' },
      { _id: 'adm-user-2', name: 'Meera Owner', email: 'owner@luxeglow.example', phone: '+91 98765 44120', role: 'owner', status: 'active', createdAt: '2026-05-10' },
      { _id: 'adm-user-3', name: 'Support Agent', email: 'support@glowverse.app', phone: '+91 90000 44444', role: 'admin', status: 'active', createdAt: '2026-04-02' }
    ],
    salons: [
      { _id: 'adm-salon-1', name: 'LuxeGlow Studio Indiranagar', locality: 'Indiranagar', approved: true, verificationStatus: 'verified', suspended: false, rating: 4.8 },
      { _id: 'adm-salon-2', name: 'Natura Belle Rajajinagar', locality: 'Rajajinagar', approved: false, verificationStatus: 'pending', suspended: false, rating: 4.4 },
      { _id: 'adm-salon-3', name: 'Velvet Vanity Whitefield', locality: 'Whitefield', approved: true, verificationStatus: 'verified', suspended: true, rating: 4.1 }
    ],
    bookings: [
      { _id: 'adm-book-1', user: { name: 'Anjana M' }, salon: { name: 'Natura Belle Rajajinagar' }, date: '2026-06-20', slot: '10:00 AM', status: 'confirmed', amount: 798 },
      { _id: 'adm-book-2', user: { name: 'Priya Nair' }, salon: { name: 'LuxeGlow Studio Indiranagar' }, date: '2026-06-20', slot: '02:30 PM', status: 'completed', amount: 6200 },
      { _id: 'adm-book-3', user: { name: 'Kavya S' }, salon: { name: 'Velvet Vanity Whitefield' }, date: '2026-06-21', slot: '12:00 PM', status: 'pending_payment', amount: 3400 }
    ],
    payments: [
      { _id: 'adm-pay-1', transactionId: 'pay_RAJ1001', method: 'UPI', status: 'paid', amount: 798, paidAt: '2026-06-20 10:01 AM' },
      { _id: 'adm-pay-2', transactionId: 'pay_LUX1002', method: 'Card', status: 'paid', amount: 6200, paidAt: '2026-06-20 02:05 PM' },
      { _id: 'adm-pay-3', transactionId: 'pay_FAIL03', method: 'UPI', status: 'failed', amount: 3400, paidAt: null }
    ],
    reviews: [
      { _id: 'adm-rev-1', salon: { name: 'Velvet Vanity Whitefield' }, userName: 'Guest User', rating: 1, sentiment: 'negative', status: 'reported', reportReason: 'Suspicious repeated review' }
    ],
    categories: [
      { _id: 'adm-cat-1', name: 'Hair', description: 'Cuts, color, styling', active: true, sortOrder: 1 },
      { _id: 'adm-cat-2', name: 'Skin', description: 'Facials and cleanup', active: true, sortOrder: 2 }
    ],
    tickets: [
      { _id: 'adm-ticket-1', user: { name: 'Anjana M' }, subject: 'Invoice not downloading', category: 'payments', priority: 'high', status: 'open' },
      { _id: 'adm-ticket-2', user: { name: 'Priya Nair' }, subject: 'Refund request', category: 'refunds', priority: 'medium', status: 'in_progress' }
    ],
    banners: [
      { _id: 'adm-ban-1', title: 'Monsoon Glow Week', placement: 'home', active: true, startsAt: '2026-06-20', endsAt: '2026-07-01' }
    ],
    settings: { commissionPercent: 12, gstPercent: 18, convenienceFee: 24, cancellationWindowHours: 4, payoutCycleDays: 7 }
  }
};

const bookingStatusActions = [
  ['pending_payment', 'Pending'],
  ['confirmed', 'Confirm'],
  ['rescheduled', 'Reschedule'],
  ['completed', 'Complete'],
  ['cancelled', 'Cancel']
];

function withLocalAdminOrders(source) {
  const localBookings = getLocalOrders().map((order) => ({
    ...order,
    _id: order._id,
    user: order.user || { name: 'GlowVerse Customer' },
    salon: order.salon || { name: order.salonName || 'GlowVerse Salon' },
    service: order.service || { name: order.services?.[0]?.name || 'Salon service' },
    date: order.date || order.appointmentDate,
    slot: order.slot || '10:00 AM',
    status: order.status || 'confirmed',
    amount: order.amount || 0
  }));
  if (!localBookings.length) return source;
  const existingIds = new Set((source.editable?.bookings || []).map((item) => item._id));
  const mergedBookings = [...localBookings.filter((item) => !existingIds.has(item._id)), ...(source.editable?.bookings || [])];
  const localPayments = localBookings.map((booking) => ({
    ...(booking.payment || {}),
    _id: booking.payment?._id || `pay-${booking._id}`,
    booking: booking._id,
    transactionId: booking.transactionId || booking.payment?.transactionId,
    method: booking.paymentMethod || booking.payment?.method || 'upi',
    status: 'paid',
    amount: booking.amount,
    paidAt: booking.payment?.paidAt || new Date().toISOString()
  }));
  return {
    ...source,
    metrics: {
      ...(source.metrics || {}),
      totalBookings: mergedBookings.length,
      totalRevenue: mergedBookings.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    },
    editable: {
      ...(source.editable || {}),
      bookings: mergedBookings,
      payments: [...localPayments, ...(source.editable?.payments || [])]
    }
  };
}

function StatusPill({ value }) {
  const text = String(value ?? '-');
  const tone = /pending|needs|flagged|payment|open|progress|suspended/i.test(text)
    ? 'bg-gold/15 text-gold'
    : /negative|risk|failed|cancelled|reported|deleted/i.test(text)
      ? 'bg-rose/10 text-rose'
      : 'bg-sage/15 text-sage';
  return <span className={`rounded-full px-2 py-1 text-xs font-black ${tone}`}>{text}</span>;
}

function val(form, key) {
  return form.get(key)?.toString().trim();
}

function Field({ name, placeholder, type = 'text', defaultValue = '', required = false }) {
  return <input name={name} type={type} placeholder={placeholder} defaultValue={defaultValue ?? ''} required={required} className="focus-ring h-11 rounded-md border border-white/10 bg-white/10 px-3 text-sm" />;
}

function DataTable({ rows, actions }) {
  if (!rows?.length) return <p className="rounded-md bg-white/10 p-4 text-sm font-bold">No records found.</p>;
  const headers = Object.keys(rows[0]).filter((header) => !header.startsWith('_') && header !== 'raw');
  return (
    <div className="overflow-auto rounded-lg border border-white/10">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-ink text-white dark:bg-white dark:text-ink">
          <tr>
            {headers.map((header) => <th key={header} className="px-4 py-3 capitalize">{header}</th>)}
            {actions && <th className="px-4 py-3">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id || row.id || row.name || row.title} className="border-t border-white/10">
              {headers.map((header) => (
                <td key={header} className="px-4 py-3">
                  {['status', 'risk', 'sentiment', 'verification', 'approved', 'suspended', 'active'].includes(header) ? <StatusPill value={row[header]} /> : String(row[header] ?? '')}
                </td>
              ))}
              {actions && <td className="px-4 py-3"><ActionDropdown>{actions(row)}</ActionDropdown></td>}
            </tr>
          ))}
        </tbody>
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

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function AdminDashboardPage() {
  const { user, demoLogin } = useAuth();
  const [searchParams] = useSearchParams();
  const [analytics, setAnalytics] = useState(fallbackAnalytics);
  const requestedModule = searchParams.get('module');
  const [activeModule, setActiveModule] = useState(requestedModule || 'users');
  const [query, setQuery] = useState('');
  const [connectionState, setConnectionState] = useState('loading');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const outputRef = useRef(null);

  async function load() {
    try {
      const data = await fetchAdminWorkspace();
      setAnalytics({ ...fallbackAnalytics, ...data, editable: { ...fallbackAnalytics.editable, ...(data.editable || {}) } });
      setConnectionState('live');
    } catch {
      setAnalytics(withLocalAdminOrders(fallbackAnalytics));
      setConnectionState('offline');
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      if (!user) await demoLogin('admin');
      if (!cancelled) await load();
    }
    boot();
    const timer = window.setInterval(load, 15000);
    const refreshOnFocus = () => load();
    window.addEventListener('focus', refreshOnFocus);
    window.addEventListener('glowverse-local-customer-updated', refreshOnFocus);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener('focus', refreshOnFocus);
      window.removeEventListener('glowverse-local-customer-updated', refreshOnFocus);
    };
  }, [demoLogin, user]);

  const modules = useMemo(() => [
    { key: 'users', title: 'User management', icon: UsersRound, metric: `${analytics.metrics?.totalUsers || 0} users` },
    { key: 'salons', title: 'Salon approvals', icon: Store, metric: `${analytics.metrics?.approvedSalons || 0}/${analytics.metrics?.totalSalons || 0} approved` },
    { key: 'bookings', title: 'Global bookings', icon: CreditCard, metric: `${analytics.metrics?.totalBookings || 0} bookings` },
    { key: 'payments', title: 'Payments', icon: ShieldCheck, metric: `Rs. ${Number(analytics.metrics?.totalRevenue || 0).toLocaleString('en-IN')}` },
    { key: 'analytics', title: 'Analytics', icon: BarChart3, metric: `Commission Rs. ${Number(analytics.metrics?.totalCommission || 0).toLocaleString('en-IN')}` },
    { key: 'categories', title: 'Categories', icon: Tags, metric: `${analytics.editable?.categories?.length || 0} records` },
    { key: 'tickets', title: 'Support tickets', icon: Ticket, metric: `${analytics.editable?.tickets?.length || 0} tickets` },
    { key: 'banners', title: 'Banners', icon: ImageIcon, metric: `${analytics.editable?.banners?.length || 0} banners` },
    { key: 'fraud', title: 'Fraud review', icon: ShieldAlert, metric: `${analytics.editable?.reviews?.length || 0} flags` },
    { key: 'settings', title: 'Settings', icon: Settings, metric: `${analytics.editable?.settings?.commissionPercent || 12}% commission` },
    { key: 'announcements', title: 'Announcements', icon: Megaphone, metric: 'Notify users' },
    { key: 'reports', title: 'Reports', icon: Download, metric: 'CSV / PDF' }
  ], [analytics]);

  const rowsByModule = useMemo(() => {
    const editable = analytics.editable || {};
    return {
      users: (editable.users || []).map((item) => ({
        _id: item._id,
        name: item.name,
        email: item.email,
        phone: item.phone || '-',
        role: item.role,
        status: item.status || 'active',
        joined: item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN') : '-'
      })),
      salons: (editable.salons || []).map((item) => ({
        _id: item._id,
        name: item.name,
        locality: item.locality || '-',
        approved: item.approved ? 'Approved' : 'Pending',
        verification: item.verificationStatus || (item.approved ? 'verified' : 'pending'),
        suspended: item.suspended ? 'Suspended' : 'Live',
        rating: item.rating || 0
      })),
      bookings: (editable.bookings || []).map((item) => ({
        _id: item._id,
        salon: item.salon?.name || 'Salon',
        customer: item.user?.name || item.customerName || 'Customer',
        slot: `${item.date || '-'} ${item.slot || ''}`.trim(),
        status: item.status,
        amount: `Rs. ${Number(item.amount || 0).toLocaleString('en-IN')}`
      })),
      payments: (editable.payments || []).map((item) => ({
        _id: item._id,
        paymentId: item.transactionId || item.providerPaymentId || String(item._id).slice(-6),
        method: item.method || '-',
        status: item.status,
        amount: `Rs. ${Number(item.amount || 0).toLocaleString('en-IN')}`,
        paidAt: item.paidAt ? new Date(item.paidAt).toLocaleString('en-IN') : 'Not paid'
      })),
      categories: (editable.categories || []).map((item) => ({
        _id: item._id,
        name: item.name,
        description: item.description || '-',
        active: item.active ? 'Active' : 'Inactive',
        sortOrder: item.sortOrder || 0
      })),
      tickets: (editable.tickets || []).map((item) => ({
        _id: item._id,
        customer: item.user?.name || 'Customer',
        subject: item.subject,
        category: item.category,
        priority: item.priority,
        status: item.status
      })),
      banners: (editable.banners || []).map((item) => ({
        _id: item._id,
        title: item.title,
        placement: item.placement,
        active: item.active ? 'Active' : 'Inactive',
        startsAt: item.startsAt ? new Date(item.startsAt).toLocaleDateString('en-IN') : '-',
        endsAt: item.endsAt ? new Date(item.endsAt).toLocaleDateString('en-IN') : '-'
      })),
      fraud: (editable.reviews || []).map((item) => ({
        _id: item._id,
        salon: item.salon?.name || 'Salon',
        customer: item.userName || 'Customer',
        rating: item.rating,
        sentiment: item.sentiment || '-',
        status: item.status || 'published',
        reason: item.reportReason || '-'
      }))
    };
  }, [analytics]);

  const activeRows = useMemo(() => {
    const data = rowsByModule[activeModule] || [];
    const needle = query.trim().toLowerCase();
    if (!needle) return data;
    return data.filter((row) => Object.values(row).join(' ').toLowerCase().includes(needle));
  }, [activeModule, query, rowsByModule]);

  if (user?.role === 'owner') return <Navigate to="/owner/dashboard" replace />;
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
    setActiveModule(key);
    window.setTimeout(() => outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  async function exportCsv() {
    try {
      const response = await api.get('/management/admin/reports/platform', { responseType: 'blob' });
      downloadBlob(response.data, 'admin-platform-report.csv');
    } catch {
      downloadBlob(new Blob(['section,id,name,amount\nbooking,adm-book-1,Anjana M,798\npayment,adm-pay-2,Priya Nair,6200'], { type: 'text/csv' }), 'admin-platform-report.csv');
    }
  }

  function exportPdf() {
    const doc = new jsPDF();
    doc.text('GlowVerse Admin Platform Report', 20, 20);
    doc.text(`Users: ${analytics.metrics?.totalUsers || 0}`, 20, 35);
    doc.text(`Salons: ${analytics.metrics?.totalSalons || 0}`, 20, 48);
    doc.text(`Bookings: ${analytics.metrics?.totalBookings || 0}`, 20, 61);
    doc.text(`Revenue: Rs. ${Number(analytics.metrics?.totalRevenue || 0).toLocaleString('en-IN')}`, 20, 74);
    doc.text(`Commission: Rs. ${Number(analytics.metrics?.totalCommission || 0).toLocaleString('en-IN')}`, 20, 87);
    doc.save('admin-platform-report.pdf');
  }

  function updateEditableCollection(key, updater) {
    setAnalytics((current) => ({
      ...current,
      editable: {
        ...current.editable,
        [key]: updater(current.editable?.[key] || [])
      }
    }));
  }

  function actionsFor(row) {
    if (activeModule === 'users') {
      const nextStatus = row.status === 'active' ? 'suspended' : 'active';
      return (
        <>
          <Button disabled={busy} variant="secondary" onClick={() => run(() => adminUpdateUser(row._id, { status: nextStatus }), 'User status updated', () => updateEditableCollection('users', (items) => items.map((item) => item._id === row._id ? { ...item, status: nextStatus } : item)))}>{row.status === 'active' ? 'Suspend' : 'Activate'}</Button>
          <Button disabled={busy} variant="ghost" onClick={() => run(() => adminDeleteUser(row._id), 'User deleted', () => updateEditableCollection('users', (items) => items.filter((item) => item._id !== row._id)))}>Delete</Button>
        </>
      );
    }
    if (activeModule === 'salons') {
      const suspended = row.suspended === 'Suspended';
      return (
        <>
          <Button disabled={busy} variant="secondary" onClick={() => run(() => adminModerateSalon(row._id, { approved: true, verificationStatus: 'verified', suspended: false }), 'Salon approved', () => updateEditableCollection('salons', (items) => items.map((item) => item._id === row._id ? { ...item, approved: true, verificationStatus: 'verified', suspended: false } : item)))}>Approve</Button>
          <Button disabled={busy} variant="secondary" onClick={() => run(() => adminModerateSalon(row._id, { suspended: !suspended, suspensionReason: suspended ? '' : 'Admin moderation' }), suspended ? 'Salon restored' : 'Salon suspended', () => updateEditableCollection('salons', (items) => items.map((item) => item._id === row._id ? { ...item, suspended: !suspended, suspensionReason: suspended ? '' : 'Admin moderation' } : item)))}>{suspended ? 'Restore' : 'Suspend'}</Button>
          <Button disabled={busy} variant="ghost" onClick={() => run(() => adminDeleteSalon(row._id), 'Salon deleted', () => updateEditableCollection('salons', (items) => items.filter((item) => item._id !== row._id)))}>Delete</Button>
        </>
      );
    }
    if (activeModule === 'bookings') {
      return bookingStatusActions.map(([status, label]) => <Button key={status} disabled={busy} variant="secondary" onClick={() => run(() => adminUpdateBookingStatus(row._id, status), `Booking marked ${status}`, () => setAnalytics((current) => ({ ...current, editable: { ...current.editable, bookings: (current.editable.bookings || []).map((item) => item._id === row._id ? { ...item, status } : item) } })))}>{label}</Button>);
    }
    if (activeModule === 'categories') {
      const nextActive = row.active !== 'Active';
      return (
        <>
          <Button disabled={busy} variant="secondary" onClick={() => run(() => adminUpsertCategory({ name: row.name, description: row.description === '-' ? '' : row.description, active: nextActive, sortOrder: row.sortOrder }, row._id), 'Category updated', () => updateEditableCollection('categories', (items) => items.map((item) => item._id === row._id ? { ...item, active: nextActive } : item)))}>Toggle</Button>
          <Button disabled={busy} variant="ghost" onClick={() => run(() => adminDeleteCategory(row._id), 'Category deleted', () => updateEditableCollection('categories', (items) => items.filter((item) => item._id !== row._id)))}>Delete</Button>
        </>
      );
    }
    if (activeModule === 'tickets') {
      return (
        <>
          <Button disabled={busy} variant="secondary" onClick={() => run(() => adminUpdateTicket(row._id, { status: 'in_progress' }), 'Ticket moved to progress', () => updateEditableCollection('tickets', (items) => items.map((item) => item._id === row._id ? { ...item, status: 'in_progress' } : item)))}>In progress</Button>
          <Button disabled={busy} variant="secondary" onClick={() => run(() => adminUpdateTicket(row._id, { status: 'resolved', response: 'Resolved by GlowVerse support.' }), 'Ticket resolved', () => updateEditableCollection('tickets', (items) => items.map((item) => item._id === row._id ? { ...item, status: 'resolved', response: 'Resolved by GlowVerse support.' } : item)))}>Resolve</Button>
          <Button disabled={busy} variant="ghost" onClick={() => run(() => adminUpdateTicket(row._id, { status: 'closed' }), 'Ticket closed', () => updateEditableCollection('tickets', (items) => items.map((item) => item._id === row._id ? { ...item, status: 'closed' } : item)))}>Close</Button>
        </>
      );
    }
    if (activeModule === 'banners') {
      const nextActive = row.active !== 'Active';
      return (
        <>
          <Button disabled={busy} variant="secondary" onClick={() => run(() => adminUpsertBanner({ title: row.title, placement: row.placement, active: nextActive }, row._id), 'Banner updated', () => updateEditableCollection('banners', (items) => items.map((item) => item._id === row._id ? { ...item, active: nextActive } : item)))}>Toggle</Button>
          <Button disabled={busy} variant="ghost" onClick={() => run(() => adminDeleteBanner(row._id), 'Banner deleted', () => updateEditableCollection('banners', (items) => items.filter((item) => item._id !== row._id)))}>Delete</Button>
        </>
      );
    }
    if (activeModule === 'fraud') {
      return (
        <>
          <Button disabled={busy} variant="secondary" onClick={() => run(() => adminModerateReview(row._id, { status: 'published', reported: false, reportReason: '' }), 'Review cleared', () => updateEditableCollection('reviews', (items) => items.map((item) => item._id === row._id ? { ...item, status: 'published', reported: false, reportReason: '' } : item)))}>Clear</Button>
          <Button disabled={busy} variant="ghost" onClick={() => run(() => adminModerateReview(row._id, { status: 'reported', reported: true, reportReason: 'Admin flagged for review' }), 'Review flagged', () => updateEditableCollection('reviews', (items) => items.map((item) => item._id === row._id ? { ...item, status: 'reported', reported: true, reportReason: 'Admin flagged for review' } : item)))}>Flag</Button>
        </>
      );
    }
    return null;
  }

  return (
    <section className="section py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-black">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-ink/65 dark:text-white/65">Platform operations, approvals, moderation, booking supervision, support, settings, and real-data analytics.</p>
          {connectionState !== 'live' && <p className="mt-2 rounded-md bg-gold/15 px-3 py-2 text-sm font-bold text-gold">Backend dashboard data is unavailable. Start backend + MongoDB for live admin management.</p>}
          {message && <p className="mt-2 rounded-md bg-sage/15 px-3 py-2 text-sm font-bold text-sage">{message}</p>}
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/45 dark:text-white/45" size={17} />
          <input className="focus-ring h-11 w-full rounded-md border border-ink/10 bg-white pl-10 pr-3 dark:border-white/10 dark:bg-white/10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search admin records" />
        </div>
      </div>

      <div className="mt-5">
        <PortalSalonSearch title="Admin search any Bengaluru salon" compact />
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {modules.map(({ key, title, icon: Icon, metric }) => (
          <button key={key} type="button" onClick={() => openModule(key)} className={`focus-ring rounded-lg border p-4 text-left shadow-sm transition hover:-translate-y-0.5 ${activeModule === key ? 'border-rose bg-rose text-white' : 'border-white/10 bg-white/10 hover:bg-white/15'}`}>
            <Icon size={22} />
            <p className="mt-3 font-black">{title}</p>
            <p className={`mt-1 text-xs font-bold ${activeModule === key ? 'text-white/75' : 'text-ink/55 dark:text-white/55'}`}>{metric}</p>
          </button>
        ))}
      </div>

      <div ref={outputRef} className="mt-6 scroll-mt-24 rounded-xl border border-white/10 bg-white/10 p-5 shadow-glow backdrop-blur-xl">
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-lg bg-white/10 p-4"><p className="text-xs font-black uppercase text-gold">Total users</p><p className="mt-1 text-2xl font-black">{analytics.metrics?.totalUsers || 0}</p></div>
          <div className="rounded-lg bg-white/10 p-4"><p className="text-xs font-black uppercase text-gold">Total salons</p><p className="mt-1 text-2xl font-black">{analytics.metrics?.totalSalons || 0}</p></div>
          <div className="rounded-lg bg-white/10 p-4"><p className="text-xs font-black uppercase text-gold">Total bookings</p><p className="mt-1 text-2xl font-black">{analytics.metrics?.totalBookings || 0}</p></div>
          <div className="rounded-lg bg-white/10 p-4"><p className="text-xs font-black uppercase text-gold">Revenue</p><p className="mt-1 text-2xl font-black">Rs. {Number(analytics.metrics?.totalRevenue || 0).toLocaleString('en-IN')}</p></div>
          <div className="rounded-lg bg-white/10 p-4"><p className="text-xs font-black uppercase text-gold">Commission</p><p className="mt-1 text-2xl font-black">Rs. {Number(analytics.metrics?.totalCommission || 0).toLocaleString('en-IN')}</p></div>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-black">{modules.find((item) => item.key === activeModule)?.title}</h2>
          <div className="flex flex-wrap gap-2 text-xs font-black">
            <span className="rounded-full bg-sage/15 px-3 py-1 text-sage"><CheckCircle2 size={13} className="mr-1 inline" /> Live actions</span>
            <span className="rounded-full bg-gold/15 px-3 py-1 text-gold"><AlertTriangle size={13} className="mr-1 inline" /> Role protected</span>
          </div>
        </div>

        {activeModule === 'analytics' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.revenueForecast || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area dataKey="revenue" stroke="#be3455" fill="#be345533" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.popularServices || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="#c5974a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeModule === 'settings' && (
          <form className="grid gap-3 md:grid-cols-3" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); run(() => adminUpdateSettings({ commissionPercent: Number(val(form, 'commissionPercent')), gstPercent: Number(val(form, 'gstPercent')), convenienceFee: Number(val(form, 'convenienceFee')), cancellationWindowHours: Number(val(form, 'cancellationWindowHours')), payoutCycleDays: Number(val(form, 'payoutCycleDays')) }), 'Platform settings saved'); }}>
            <Field name="commissionPercent" placeholder="Commission %" type="number" defaultValue={analytics.editable?.settings?.commissionPercent ?? 12} />
            <Field name="gstPercent" placeholder="GST %" type="number" defaultValue={analytics.editable?.settings?.gstPercent ?? 18} />
            <Field name="convenienceFee" placeholder="Convenience fee" type="number" defaultValue={analytics.editable?.settings?.convenienceFee ?? 24} />
            <Field name="cancellationWindowHours" placeholder="Cancellation window hours" type="number" defaultValue={analytics.editable?.settings?.cancellationWindowHours ?? 4} />
            <Field name="payoutCycleDays" placeholder="Payout cycle days" type="number" defaultValue={analytics.editable?.settings?.payoutCycleDays ?? 7} />
            <Button disabled={busy} type="submit"><Settings size={16} /> Save settings</Button>
          </form>
        )}

        {activeModule === 'announcements' && (
          <form className="grid gap-3 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); run(() => adminSendAnnouncement({ title: val(form, 'title'), body: val(form, 'body'), role: val(form, 'role') || undefined }), 'Announcement sent'); event.currentTarget.reset(); }}>
            <Field name="title" placeholder="Announcement title" required />
            <select name="role" className="focus-ring h-11 rounded-md border border-white/10 bg-white/10 px-3 text-sm"><option value="">All roles</option><option value="user">Customers</option><option value="owner">Owners</option><option value="admin">Admins</option></select>
            <textarea name="body" required placeholder="Message" className="focus-ring min-h-32 rounded-md border border-white/10 bg-white/10 p-3 text-sm md:col-span-2" />
            <Button disabled={busy} type="submit"><Megaphone size={16} /> Send announcement</Button>
          </form>
        )}

        {activeModule === 'categories' && (
          <form className="mb-4 grid gap-3 md:grid-cols-4" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); run(() => adminUpsertCategory({ name: val(form, 'name'), description: val(form, 'description'), sortOrder: Number(val(form, 'sortOrder') || 0) }), 'Category saved'); event.currentTarget.reset(); }}>
            <Field name="name" placeholder="Category name" required />
            <Field name="description" placeholder="Description" />
            <Field name="sortOrder" placeholder="Sort order" type="number" />
            <Button disabled={busy} type="submit"><Tags size={16} /> Add category</Button>
          </form>
        )}

        {activeModule === 'banners' && (
          <form className="mb-4 grid gap-3 md:grid-cols-4" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); run(() => adminUpsertBanner({ title: val(form, 'title'), subtitle: val(form, 'subtitle'), imageUrl: val(form, 'imageUrl'), linkUrl: val(form, 'linkUrl'), placement: val(form, 'placement'), endsAt: val(form, 'endsAt') }), 'Banner saved'); event.currentTarget.reset(); }}>
            <Field name="title" placeholder="Banner title" required />
            <Field name="subtitle" placeholder="Subtitle" />
            <Field name="imageUrl" placeholder="Image URL" />
            <Field name="linkUrl" placeholder="Link URL" />
            <Field name="placement" placeholder="Placement" defaultValue="home" />
            <Field name="endsAt" placeholder="Ends at" type="date" />
            <Button disabled={busy} type="submit"><ImageIcon size={16} /> Add banner</Button>
          </form>
        )}

        {activeModule === 'reports' && (
          <div className="flex flex-wrap gap-3">
            <Button disabled={busy} onClick={exportCsv}><Download size={16} /> Export Excel CSV</Button>
            <Button disabled={busy} variant="secondary" onClick={exportPdf}><FileText size={16} /> Export PDF</Button>
          </div>
        )}

        {!['analytics', 'settings', 'announcements', 'reports'].includes(activeModule) && (
          <DataTable rows={activeRows} actions={actionsFor} />
        )}
      </div>
    </section>
  );
}
