import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck, CheckCircle2, CreditCard, Download, QrCode, Scissors, ShieldCheck, Smartphone, UserRound } from 'lucide-react';
import { createBooking, verifyBookingPayment } from '../api/client.js';
import { Button } from './common/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { buildInvoiceData, downloadInvoicePdf } from '../utils/invoice.js';
import { saveLocalSalonBookingOrder } from '../pages/customerUtils.jsx';

const steps = ['Service', 'Stylist', 'Date', 'Slot', 'Payment'];
const demoUpiId = 'glowverse.pay@upi';

function money(value) {
  return `Rs. ${Number(value || 0).toLocaleString('en-IN')}`;
}

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function BookingFlow({ salon, onToast }) {
  const { user, demoLogin } = useAuth();
  const [selected, setSelected] = useState({
    serviceId: salon.services?.[0]?._id,
    stylistId: salon.stylists?.[0]?._id,
    date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    slot: salon.availableSlots?.[0] || '10:00 AM',
    paymentMethod: 'upi'
  });
  const [confirmed, setConfirmed] = useState(null);
  const [bookingUser, setBookingUser] = useState(user);
  const [processing, setProcessing] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const service = useMemo(() => salon.services?.find((item) => item._id === selected.serviceId), [salon.services, selected.serviceId]);
  const stylist = useMemo(() => salon.stylists?.find((item) => item._id === selected.stylistId), [salon.stylists, selected.stylistId]);
  const availability = salon.availability;
  const slotOptions = useMemo(
    () => {
      const today = new Date().toISOString().slice(0, 10);
      const isToday = selected.date === today;
      const baseSlots = availability?.allSlots?.length
        ? availability.allSlots
        : (salon.availableSlots || []).map((slot) => ({ label: slot, disabled: false, remaining: salon.stylists?.length || 1 }));
      return baseSlots.map((slot) => ({
        ...slot,
        disabled: isToday ? slot.disabled : slot.remaining === 0
      }));
    },
    [availability?.allSlots, salon.availableSlots, salon.stylists?.length, selected.date]
  );
  const selectedSlot = slotOptions.find((slot) => slot.label === selected.slot);
  const canBookNow = Boolean(selectedSlot && !selectedSlot.disabled);
  const convenienceFee = 24;
  const total = (service?.price || 0) + convenienceFee;
  const confirmedPayment = confirmed?.payment;
  const amountPaid = confirmedPayment?.amount ?? confirmed?.amount ?? total;

  useEffect(() => {
    const firstAvailable = slotOptions.find((slot) => !slot.disabled);
    if ((!selected.slot || selectedSlot?.disabled) && firstAvailable) {
      setSelected((current) => ({ ...current, slot: firstAvailable.label }));
    }
  }, [selected.slot, selectedSlot?.disabled, slotOptions]);

  function buildSavedConfirmation(base = {}) {
    const transactionId = base.transactionId || base.payment?.transactionId || base.payment?.providerPaymentId || base.payment?.providerOrderId;
    return {
      ...base,
      transactionId,
      paymentId: base.paymentId || base.providerPaymentId || base.payment?.providerPaymentId || base.payment?.providerOrderId || base.transactionId,
      payment: base.payment,
      paymentStatus: base.payment?.status === 'paid' || base.paymentStatus === 'Paid' ? 'Paid' : 'Pending',
      paidAt: base.paidAt || base.payment?.paidAt || new Date().toLocaleString(),
      calendarUrl: base.calendarUrl || `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(service?.name || 'GlowVerse booking')}`,
      upiId: demoUpiId
    };
  }

  function bookingErrorMessage(error) {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.code === 'ERR_NETWORK' || /network|timeout|connect/i.test(error?.message || '')) {
      return 'Booking was not saved because the backend server is offline. Start the backend and MongoDB, then try again.';
    }
    return error?.message || 'Booking failed. Please try again.';
  }

  function isOfflineError(error) {
    return error?.code === 'ERR_NETWORK' || /network|timeout|connect/i.test(error?.message || '');
  }

  async function downloadInvoice() {
    if (downloadingInvoice) return;
    setDownloadingInvoice(true);
    try {
      const invoice = buildInvoiceData({
        user: bookingUser || user,
        salon,
        booking: confirmed,
        payment: confirmed.payment,
        service,
        stylist,
        selected,
        convenienceFee: confirmed.convenienceFee ?? convenienceFee,
        total: amountPaid
      });
      const { fileName } = await downloadInvoicePdf(invoice);
      onToast?.(`${fileName} download started.`);
    } catch (error) {
      onToast?.(error.message || 'Invoice download failed. Please try again.');
    } finally {
      setDownloadingInvoice(false);
    }
  }

  async function book() {
    if (!canBookNow) {
      onToast?.(availability?.isOpen ? 'Selected slot is unavailable. Choose another time.' : `${availability?.statusText || 'Salon is closed'}. Next available: ${availability?.nextAvailableSlot || 'Tomorrow 09:00 AM'}.`);
      return;
    }
    let activeUser = user;
    if (!activeUser) activeUser = await demoLogin('user');
    setBookingUser(activeUser);
    setProcessing(true);
    try {
      const data = await createBooking({ salonId: salon._id, ...selected });
      const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
      const canUseRazorpay = key && data.razorpayOrder && !data.razorpayOrder.demo && await loadRazorpayScript();
      if (canUseRazorpay) {
        const options = {
          key,
          amount: data.razorpayOrder.amount,
          currency: data.razorpayOrder.currency || 'INR',
          name: 'GlowVerse',
          description: `${service?.name} at ${salon.name}`,
          order_id: data.razorpayOrder.id,
          method: {
            upi: true,
            card: true,
            netbanking: true,
            wallet: true
          },
          prefill: {
            name: activeUser?.name,
            email: activeUser?.email
          },
          notes: {
            salon: salon.name,
            service: service?.name,
            appointment: `${selected.date} ${selected.slot}`
          },
          theme: { color: '#be3455' },
          handler: async (response) => {
            const verified = await verifyBookingPayment({
              bookingId: data.booking._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            setConfirmed(buildSavedConfirmation({
              ...verified.booking,
              payment: verified.payment,
              transactionId: response.razorpay_payment_id,
              paymentStatus: 'Paid'
            }));
            onToast?.('Razorpay payment verified. Booking confirmed.');
          }
        };
        const checkout = new window.Razorpay(options);
        checkout.on('payment.failed', () => {
          onToast?.('Payment failed. Please try again.');
          setProcessing(false);
        });
        checkout.open();
        setProcessing(false);
        return;
      }
      setConfirmed(buildSavedConfirmation({ ...data.booking, payment: data.payment, paymentId: data.payment?.providerPaymentId || data.payment?.providerOrderId }));
      onToast?.('Payment saved. Booking is now available in admin and owner dashboards.');
    } catch (error) {
      if (isOfflineError(error)) {
        const localBooking = saveLocalSalonBookingOrder({
          user: activeUser,
          salon,
          service,
          stylist,
          selected,
          amount: total,
          convenienceFee,
          paymentMethod: selected.paymentMethod
        });
        setConfirmed(buildSavedConfirmation({ ...localBooking, payment: localBooking.payment, paymentStatus: 'Paid' }));
        onToast?.('Payment confirmed in demo mode. Invoice is ready to download.');
      } else {
        onToast?.(bookingErrorMessage(error));
      }
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow-glow backdrop-blur-xl">
      <h2 className="flex items-center gap-2 font-display text-2xl font-black">
        <CalendarCheck className="text-rose" /> Book appointment
      </h2>
      <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
        {steps.map((step) => (
          <span key={step} className="rounded-full bg-ink px-3 py-1 text-white dark:bg-white dark:text-ink">{step}</span>
        ))}
      </div>

      {confirmed ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-sage/30 bg-sage/15 p-5">
            <CheckCircle2 className="text-sage" size={34} />
            <h3 className="mt-3 text-2xl font-black">Payment successful</h3>
            <p className="mt-2 text-sm text-ink/70 dark:text-white/70">Your appointment and payment record have been saved. Admin and owner dashboards will reflect this booking.</p>
          </div>
          <div className="rounded-xl bg-pearl p-4 text-sm dark:bg-ink/70">
            <div className="grid gap-3">
              <p><strong>Invoice:</strong> {confirmed.invoiceNumber}</p>
              <p><strong>Transaction ID:</strong> {confirmed.transactionId}</p>
              <p><strong>UPI ID:</strong> {confirmed.upiId}</p>
              <p><strong>Amount paid:</strong> {money(amountPaid)}</p>
              <p><strong>Service:</strong> {service?.name} with {stylist?.name}</p>
              <p><strong>Slot:</strong> {selected.date}, {selected.slot}</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button onClick={downloadInvoice} disabled={downloadingInvoice}>
              <Download size={18} /> {downloadingInvoice ? 'Preparing invoice...' : 'Download invoice'}
            </Button>
            <a className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md border border-ink/10 bg-white px-4 py-2 text-sm font-bold text-ink dark:border-white/10 dark:bg-white/10 dark:text-white" href={confirmed.calendarUrl} target="_blank" rel="noreferrer">Add to calendar</a>
          </div>
        </div>
      ) : (
        <div className="mt-5 grid gap-4">
          <label>
            <span className="mb-2 flex items-center gap-2 text-sm font-bold"><Scissors size={16} /> Service</span>
            <select className="focus-ring h-12 w-full rounded-md border border-ink/10 bg-pearl px-3 dark:border-white/10 dark:bg-ink" value={selected.serviceId} onChange={(event) => setSelected({ ...selected, serviceId: event.target.value })}>
              {salon.services?.map((item) => <option key={item._id} value={item._id}>{item.category} - {item.name} / {money(item.price)}</option>)}
            </select>
          </label>
          <label>
            <span className="mb-2 flex items-center gap-2 text-sm font-bold"><UserRound size={16} /> Stylist</span>
            <select className="focus-ring h-12 w-full rounded-md border border-ink/10 bg-pearl px-3 dark:border-white/10 dark:bg-ink" value={selected.stylistId} onChange={(event) => setSelected({ ...selected, stylistId: event.target.value })}>
              {salon.stylists?.map((item) => <option key={item._id} value={item._id}>{item.name} / {item.title}</option>)}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="focus-ring h-12 rounded-md border border-ink/10 bg-pearl px-3 dark:border-white/10 dark:bg-ink" type="date" value={selected.date} onChange={(event) => setSelected({ ...selected, date: event.target.value })} />
            <select className="focus-ring h-12 rounded-md border border-ink/10 bg-pearl px-3 dark:border-white/10 dark:bg-ink" value={selected.slot} onChange={(event) => setSelected({ ...selected, slot: event.target.value })}>
              {slotOptions.map((slot) => <option key={slot.label} value={slot.label} disabled={slot.disabled}>{slot.label}{slot.disabled ? ' - unavailable' : ` - ${slot.remaining} open`}</option>)}
            </select>
          </div>
          {availability && (
            <div className="rounded-xl border border-white/10 bg-white/10 p-4 text-sm">
              <p className="font-black">{availability.statusText}</p>
              {availability.isOpen ? (
                <p className="mt-1 text-ink/65 dark:text-white/65">{availability.availableSlots.length} slots available today. Next: {availability.nextAvailableSlot}.</p>
              ) : (
                <p className="mt-1 text-ink/65 dark:text-white/65">Today had {availability.todayBookings} appointments. Next available: {availability.nextAvailableSlot}.</p>
              )}
            </div>
          )}
          <label>
            <span className="mb-2 flex items-center gap-2 text-sm font-bold"><CreditCard size={16} /> Payment method</span>
            <select className="focus-ring h-12 w-full rounded-md border border-ink/10 bg-pearl px-3 dark:border-white/10 dark:bg-ink" value={selected.paymentMethod} onChange={(event) => setSelected({ ...selected, paymentMethod: event.target.value })}>
              <option value="upi">UPI</option>
              <option value="gpay">Google Pay</option>
              <option value="phonepe">PhonePe</option>
              <option value="paytm">Paytm</option>
              <option value="card">Credit/Debit Card</option>
              <option value="netbanking">Net Banking</option>
              <option value="wallet">Wallet</option>
            </select>
          </label>
          <div className="rounded-xl border border-white/10 bg-pearl p-4 dark:bg-ink/70">
            <p className="text-sm text-ink/65 dark:text-white/65">Secure checkout summary</p>
            <p className="mt-1 font-bold">{service?.name} at {salon.name}</p>
            <div className="mt-3 grid gap-2 text-sm">
              <p>Service fee: {money(service?.price)}</p>
              <p>Platform convenience: {money(convenienceFee)}</p>
              <p className="text-lg font-black">Total: {money(total)}</p>
            </div>
          </div>
          <div className="grid gap-3 rounded-xl border border-white/10 bg-white/10 p-4 sm:grid-cols-[64px_1fr]">
            <div className="grid h-16 w-16 place-items-center rounded-lg bg-white text-ink"><QrCode size={34} /></div>
            <div>
              <p className="flex items-center gap-2 text-sm font-black"><Smartphone size={16} /> Demo UPI payment</p>
              <p className="mt-1 text-sm text-ink/70 dark:text-white/70">Pay to <strong>{demoUpiId}</strong>. The preview simulates a successful UPI/Razorpay confirmation.</p>
              <p className="mt-2 flex items-center gap-2 text-xs font-bold text-sage"><ShieldCheck size={14} /> Secure demo transaction, no real money charged.</p>
            </div>
          </div>
          <Button onClick={book} disabled={processing || !canBookNow}>
            <CreditCard size={18} /> {processing ? 'Processing secure payment...' : 'Pay and confirm'}
          </Button>
        </div>
      )}
    </div>
  );
}
