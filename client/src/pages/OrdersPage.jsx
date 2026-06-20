import { useEffect, useState } from 'react';
import { Eye, FileText, RefreshCcw } from 'lucide-react';
import { fetchOrders } from '../api/client.js';
import { Button } from '../components/common/Button.jsx';
import { buildInvoiceData, downloadInvoicePdf } from '../utils/invoice.js';
import { EmptyState, ErrorState, LoadingState, money } from './customerUtils.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState('');

  useEffect(() => {
    fetchOrders().then((data) => setOrders(data.orders || [])).catch((err) => setError(err.response?.data?.message || 'Orders could not be loaded.')).finally(() => setLoading(false));
  }, []);

  async function download(order) {
    const invoice = buildInvoiceData({ user, salon: order.salon, booking: order, payment: order.payment, service: order.service, stylist: order.stylist, selected: { date: order.date, slot: order.slot }, total: order.amount });
    await downloadInvoicePdf(invoice);
  }

  if (loading) return <section className="section py-10"><LoadingState label="Loading orders" /></section>;

  return (
    <section className="section py-10">
      <h1 className="font-display text-4xl font-black">Your Orders</h1>
      <ErrorState message={error} />
      {!orders.length ? <EmptyState title="No orders yet" body="Your salon bookings will appear here after checkout." /> : (
        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="rounded-xl bg-white/10 p-5 shadow-glow">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <p className="font-black">{order.invoiceNumber || order._id}</p>
                  <p className="text-sm text-ink/60 dark:text-white/60">{order.salon?.name} / {order.service?.name}</p>
                  <p className="text-sm text-ink/60 dark:text-white/60">Appointment: {order.date}, {order.slot}</p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="rounded-full bg-sage/15 px-3 py-1 text-xs font-black text-sage">{order.status}</span>
                  <p className="mt-2 font-black">{money(order.amount)}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => setExpanded(expanded === order._id ? '' : order._id)}><Eye size={16} /> View details</Button>
                <Button onClick={() => download(order)}><FileText size={16} /> Download invoice</Button>
                <Button variant="ghost" onClick={() => window.location.assign(order.salon?.slug ? `/salons/${order.salon.slug}` : '/discover')}><RefreshCcw size={16} /> Rebook</Button>
              </div>
              {expanded === order._id && (
                <div className="mt-4 grid gap-2 rounded-lg bg-white/10 p-4 text-sm">
                  <p><strong>Booking date:</strong> {new Date(order.createdAt).toLocaleString()}</p>
                  <p><strong>Payment method:</strong> {order.payment?.method || 'Not available'}</p>
                  <p><strong>Payment status:</strong> {order.payment?.status || 'Not available'}</p>
                  <p><strong>Stylist:</strong> {order.stylist?.name || 'Assigned stylist'}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
