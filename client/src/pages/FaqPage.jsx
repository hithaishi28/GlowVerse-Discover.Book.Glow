import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

const faqs = [
  ['Booking', 'How do I book a salon appointment?', 'Choose a salon, select a service, stylist, date, available slot, payment method, and confirm the booking from the booking panel.'],
  ['Booking', 'How do I reschedule?', 'Open Your Orders, choose View Details or Rebook, and select a new available slot for the same salon or service.'],
  ['Booking', 'Why is a time slot disabled?', 'Slots are disabled when the salon is closed, the stylist is unavailable, or all appointment capacity for that time has already been used.'],
  ['Booking', 'Can I choose a specific stylist?', 'Yes. Stylist options shown on a salon page belong to that salon only, and availability is calculated against that stylist schedule.'],
  ['Booking', 'What happens if the salon is closed?', 'Booking is blocked outside operating hours. GlowVerse shows the next available appointment and the current daily occupancy summary.'],
  ['Payments', 'When is payment captured?', 'A booking is confirmed only after the payment record is successful. In local demo mode, the booking is saved locally so invoices still work.'],
  ['Payments', 'Which payment methods are supported?', 'GlowVerse supports UPI-style options, Google Pay, PhonePe, Paytm, BHIM, cards, wallets, and net banking where the payment gateway is configured.'],
  ['Payments', 'Where can I download my invoice?', 'Use Download Invoice from the booking success panel or Your Orders. A professional PDF invoice is generated for paid bookings.'],
  ['Payments', 'Why did my payment fail?', 'Payment can fail because the gateway was cancelled, the backend is offline, bank authorization failed, or the selected method timed out. Try again after checking the message shown.'],
  ['Payments', 'Will failed payments confirm bookings?', 'No. Failed or cancelled live payments should not confirm a booking. Only verified or locally confirmed demo payments create invoice-ready records.'],
  ['Refunds', 'How do refunds work?', 'Cancelled paid appointments are reviewed by support based on salon policy, appointment timing, and payment status.'],
  ['Refunds', 'How long does a refund take?', 'Approved refunds generally depend on the original payment method and bank processing timeline. Support can track the refund reference.'],
  ['Refunds', 'Can I get a partial refund?', 'Partial refunds may apply when only part of a package is cancelled or when salon policy allows a deduction for late cancellation.'],
  ['Refunds', 'Where do I raise a refund request?', 'Open Customer Care, submit the booking ID and reason, and the support ticket will be tracked by the admin dashboard.'],
  ['Account', 'Can I update my profile?', 'Use the profile section in the client dashboard for personal details, beauty preferences, booking history, and notification context.'],
  ['Account', 'How is my phone or email used?', 'Phone and email help identify your account, send booking updates, support responses, and invoice/payment notifications.'],
  ['Account', 'Can I log out safely?', 'Yes. Use the hamburger menu and select Logout. Local wishlist/cart demo data is preserved on the device for continuity.'],
  ['Account', 'How do notifications work?', 'Notifications show booking confirmations, cancellations, payment updates, offers, reminders, and support actions.'],
  ['Services', 'Can I save services?', 'Tap the heart icon on a service to save it to Wishlist. Tap again to remove it.'],
  ['Services', 'Can I save salons?', 'Salon cards support wishlist saving where enabled. Saved salons are available from the Wishlist page.'],
  ['Services', 'How does cart checkout work?', 'Add services to Cart, review subtotal, GST, and grand total, then proceed to checkout and payment confirmation.'],
  ['Services', 'Why do prices vary by salon?', 'Each salon owns its own service catalog, pricing, stylist availability, ratings, offers, and business information.'],
  ['Services', 'How are offers applied?', 'Eligible salon-specific offers are shown during booking or checkout and reflected in totals, invoices, and dashboard revenue.']
];

export function FaqPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [open, setOpen] = useState('');
  const categories = ['All', ...new Set(faqs.map(([item]) => item))];
  const visible = useMemo(() => faqs.filter(([cat, q, a]) => (category === 'All' || cat === category) && `${q} ${a}`.toLowerCase().includes(query.toLowerCase())), [category, query]);

  return (
    <section className="section py-10">
      <h1 className="font-display text-4xl font-black">FAQs</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_220px]">
        <label className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/45 dark:text-white/45" size={17} /><input className="focus-ring h-12 w-full rounded-md border border-white/10 bg-white/10 pl-10 pr-3" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search FAQs" /></label>
        <select className="focus-ring h-12 rounded-md border border-white/10 bg-white/10 px-3" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option className="bg-white text-ink" key={item}>{item}</option>)}</select>
      </div>
      <div className="mt-6 space-y-3">{visible.map(([cat, question, answer]) => (
        <button key={question} type="button" onClick={() => setOpen(open === question ? '' : question)} className="focus-ring w-full rounded-xl bg-white/10 p-4 text-left shadow-glow">
          <span className="text-xs font-black uppercase text-rose">{cat}</span>
          <p className="mt-1 font-black">{question}</p>
          {open === question && <p className="mt-2 text-sm text-ink/65 dark:text-white/65">{answer}</p>}
        </button>
      ))}</div>
    </section>
  );
}
