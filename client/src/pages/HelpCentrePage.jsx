import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, CreditCard, RefreshCcw, UserRound, Store, Scissors, ArrowRight } from 'lucide-react';
import { Button } from '../components/common/Button.jsx';

const sections = [
  ['Booking Help', CalendarCheck, 'Find salons, choose slots, and manage appointments.', '/discover', ['Choose a salon', 'Pick service, stylist, date, and slot', 'Pay only after confirming details']],
  ['Payment Help', CreditCard, 'Understand payment status and invoice records.', '/client/orders', ['Track paid, pending, or failed payments', 'Download invoice PDF', 'Check payment method and booking status']],
  ['Refund Help', RefreshCcw, 'Track cancellation and refund support.', '/client/customer-care', ['Submit refund subject', 'Mention order/invoice number', 'Support follows up from the ticket']],
  ['Cancellation Help', CalendarCheck, 'Review cancellation windows before changing plans.', '/client/orders', ['Open Your Orders', 'Check confirmed/cancelled badge', 'Contact support for refund exceptions']],
  ['Account Help', UserRound, 'Login, profile, preferences, and notifications.', '/client/dashboard', ['Review profile', 'Check beauty preferences', 'Open notifications from menu']],
  ['Salon Support', Store, 'Questions about salon services, staff, and offers.', '/client/customer-care', ['Ask about offers', 'Report wrong salon info', 'Request service clarification']]
];

export function HelpCentrePage() {
  const navigate = useNavigate();
  const [active, setActive] = useState(sections[0][0]);
  const detailRef = useRef(null);
  const current = sections.find(([title]) => title === active) || sections[0];
  function openSection(title) {
    setActive(title);
    window.setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }
  return (
    <section className="section py-10">
      <h1 className="font-display text-4xl font-black">Help Centre</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sections.map(([title, Icon, body]) => (
          <button key={title} type="button" onClick={() => openSection(title)} className={`focus-ring rounded-xl p-5 text-left shadow-glow transition hover:-translate-y-0.5 ${active === title ? 'bg-rose text-white' : 'bg-white/10 hover:bg-white/15'}`}>
            <Icon className={active === title ? 'text-white' : 'text-rose'} />
            <p className="mt-4 font-black">{title}</p>
            <p className={`mt-2 text-sm ${active === title ? 'text-white/75' : 'text-ink/65 dark:text-white/65'}`}>{body}</p>
          </button>
        ))}
      </div>
      <div ref={detailRef} className="mt-6 scroll-mt-24 rounded-xl border border-white/10 bg-white/10 p-5 shadow-glow">
        <h2 className="font-display text-2xl font-black">{current[0]}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {current[4].map((step, index) => <p key={step} className="rounded-lg bg-white/10 p-4 text-sm font-bold"><span className="mr-2 text-rose">0{index + 1}</span>{step}</p>)}
        </div>
        <Button className="mt-5" onClick={() => navigate(current[3])}>Open related page <ArrowRight size={16} /></Button>
      </div>
      <div className="mt-6 rounded-xl bg-gold/15 p-5 text-sm font-bold text-gold"><Scissors className="mr-2 inline" /> Need a human? Use Customer Care to create a support ticket.</div>
    </section>
  );
}
