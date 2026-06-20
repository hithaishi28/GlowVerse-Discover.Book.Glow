import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { CreditCard, QrCode, Smartphone } from 'lucide-react';
import { Button } from '../components/common/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { buildInvoiceData, downloadInvoicePdf } from '../utils/invoice.js';
import { clearLocalCart, getLocalCart, money, saveLocalOrderFromCart } from './customerUtils.jsx';

export function CheckoutPage() {
  const { user } = useAuth();
  const [cart, setCart] = useState(getLocalCart);
  const [method, setMethod] = useState('upi');
  const [message, setMessage] = useState('');
  const [paidOrder, setPaidOrder] = useState(null);

  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === 'owner') return <Navigate to="/owner/dashboard" replace />;

  async function pay() {
    const order = saveLocalOrderFromCart(method);
    if (!order) {
      setMessage('Your cart is empty.');
      return;
    }
    setPaidOrder(order);
    setCart(clearLocalCart());
    setMessage('Payment successful. Booking confirmed and invoice is ready.');
  }

  async function invoice() {
    const invoiceData = buildInvoiceData({
      user,
      salon: paidOrder.salon,
      booking: { invoiceNumber: paidOrder.invoiceNumber, date: paidOrder.appointmentDate, slot: '10:00 AM', amount: paidOrder.amount, service: paidOrder.services?.[0] },
      payment: { status: 'paid', method: paidOrder.paymentMethod, amount: paidOrder.amount, transactionId: paidOrder._id },
      service: { name: paidOrder.services.map((item) => `${item.name} x${item.quantity}`).join(', ') },
      stylist: { name: 'Assigned stylist' },
      selected: { date: paidOrder.appointmentDate, slot: '10:00 AM' },
      total: paidOrder.amount
    });
    await downloadInvoicePdf(invoiceData);
  }

  return (
    <section className="section py-10">
      <h1 className="flex items-center gap-2 font-display text-4xl font-black"><CreditCard className="text-rose" /> Checkout & Payment</h1>
      {message && <p className="mt-4 rounded-md bg-sage/15 p-3 text-sm font-bold text-sage">{message}</p>}
      {paidOrder ? (
        <div className="mt-6 rounded-xl border border-sage/30 bg-sage/15 p-6 shadow-glow">
          <h2 className="font-display text-2xl font-black">Booking confirmed</h2>
          <p className="mt-2 text-sm">Invoice: <strong>{paidOrder.invoiceNumber}</strong></p>
          <p className="mt-1 text-sm">Amount paid: <strong>{money(paidOrder.amount)}</strong></p>
          <Button className="mt-5" onClick={invoice}>Download Invoice</Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-3">
            {cart.items.map((item) => (
              <div key={item._id} className="rounded-xl bg-white/10 p-4 shadow-glow">
                <p className="font-black">{item.name}</p>
                <p className="text-sm text-ink/60 dark:text-white/60">{item.salonName} / {money(item.price)} x {item.quantity}</p>
              </div>
            ))}
          </div>
          <aside className="rounded-xl bg-white/10 p-5 shadow-glow">
            <p className="font-display text-2xl font-black">Payment</p>
            <select className="focus-ring mt-4 h-12 w-full rounded-md border border-white/10 bg-white/10 px-3" value={method} onChange={(event) => setMethod(event.target.value)}>
              <option className="bg-white text-ink" value="upi">UPI</option>
              <option className="bg-white text-ink" value="gpay">Google Pay</option>
              <option className="bg-white text-ink" value="phonepe">PhonePe</option>
              <option className="bg-white text-ink" value="paytm">Paytm</option>
              <option className="bg-white text-ink" value="card">Credit/Debit Card</option>
            </select>
            <div className="mt-4 rounded-lg bg-white/10 p-4">
              <QrCode className="text-gold" />
              <p className="mt-2 flex items-center gap-2 text-sm font-black"><Smartphone size={16} /> glowverse.pay@upi</p>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <p className="flex justify-between"><span>Subtotal</span><strong>{money(cart.totals.subtotal)}</strong></p>
              <p className="flex justify-between"><span>GST</span><strong>{money(cart.totals.tax)}</strong></p>
              <p className="flex justify-between text-lg"><span>Grand Total</span><strong>{money(cart.totals.grandTotal)}</strong></p>
            </div>
            <Button className="mt-5 w-full" onClick={pay}>Pay and Confirm</Button>
          </aside>
        </div>
      )}
    </section>
  );
}
