import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, BarChart3, CalendarCheck, Heart, HelpCircle, MapPinned, PackageCheck, ReceiptText, ShieldCheck, ShoppingCart, Sparkles, Store, Tags, UserRound } from 'lucide-react';
import { Button } from '../components/common/Button.jsx';
import { PortalSalonSearch } from '../components/PortalSalonSearch.jsx';
import { Logo } from '../components/common/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const demoRoles = [
  {
    role: 'user',
    name: 'Anjana M',
    title: 'Client Demo',
    route: '/discover',
    icon: UserRound,
    tone: 'from-rose/25 to-gold/15',
    summary: 'Explore salons, wishlist services, add to cart, book an appointment, pay, download invoices, and track orders.',
    checklist: [
      ['Discover salons', '/discover', MapPinned],
      ['Client dashboard', '/client/dashboard', UserRound],
      ['Wishlist', '/client/wishlist', Heart],
      ['Cart', '/client/cart', ShoppingCart],
      ['Orders & invoices', '/client/orders', ReceiptText],
      ['Support & FAQs', '/client/help-centre', HelpCircle]
    ]
  },
  {
    role: 'owner',
    name: 'GlowVerse Salon Owner',
    title: 'Owner Demo',
    route: '/owner/dashboard',
    icon: Store,
    tone: 'from-sage/25 to-rose/15',
    summary: 'Manage one salon business with profile, services, staff, bookings, revenue, offers, inventory, reviews, invoices, and reports.',
    checklist: [
      ['Salon profile', '/owner/dashboard?module=profile', Store],
      ['Services and staff', '/owner/dashboard?module=services', Sparkles],
      ['Bookings calendar', '/owner/dashboard?module=appointments', CalendarCheck],
      ['Revenue analytics', '/owner/dashboard?module=revenue', BarChart3],
      ['Offers', '/owner/dashboard?module=promotions', Tags],
      ['Reports', '/owner/dashboard?module=reports', ReceiptText]
    ]
  },
  {
    role: 'admin',
    name: 'GlowVerse Admin',
    title: 'Admin Demo',
    route: '/admin/dashboard',
    icon: ShieldCheck,
    tone: 'from-gold/25 to-rose/15',
    summary: 'Review platform operations: users, salon approvals, bookings, payments, support tickets, banners, fraud checks, settings, and exports.',
    checklist: [
      ['User management', '/admin/dashboard?module=users', UserRound],
      ['Salon approvals', '/admin/dashboard?module=salons', Store],
      ['Global bookings', '/admin/dashboard?module=bookings', PackageCheck],
      ['Fraud review', '/admin/dashboard?module=fraud', ShieldCheck],
      ['Platform settings', '/admin/dashboard?module=settings', BadgeCheck],
      ['Reports', '/admin/dashboard?module=reports', ReceiptText]
    ]
  }
];

const tourNotes = [
  'The demo uses the same protected routes as the real app, so role switching proves the route guards.',
  'Client actions open real wishlist, cart, order, invoice, support, FAQ, and notification pages.',
  'Owner and admin actions open the live dashboards that call the backend management APIs when the API is running.',
  'If the backend is offline, dashboards show a graceful offline state instead of fake success data.'
];

export function DemoPortalPage() {
  const navigate = useNavigate();
  const { startDemoSession } = useAuth();
  const [loadingRole, setLoadingRole] = useState('');
  const [message, setMessage] = useState('');

  async function launchDemo(role, route) {
    setLoadingRole(role);
    setMessage('');
    try {
      startDemoSession(role);
      navigate(route);
    } catch (error) {
      setMessage(error.message || 'Could not start demo session.');
    } finally {
      setLoadingRole('');
    }
  }

  return (
    <section className="section py-8">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-white/10 bg-ink p-6 text-white shadow-glow">
          <Logo />
          <p className="mt-8 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-gold">Guided product demo</p>
          <h1 className="mt-5 font-display text-4xl font-black leading-tight sm:text-5xl">Learn GlowVerse through real portals.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72">
            Start as Anjana M for the client journey, then switch into owner and admin mode to see how bookings, payments, invoices, offers, analytics, and management tools flow through the platform.
          </p>
          {message && <p className="mt-4 rounded-md bg-rose/15 p-3 text-sm font-bold text-rose">{message}</p>}
          <div className="mt-6 grid gap-3">
            {tourNotes.map((note) => (
              <p key={note} className="flex gap-3 rounded-lg bg-white/10 p-3 text-sm font-semibold text-white/80">
                <BadgeCheck className="mt-0.5 shrink-0 text-sage" size={17} /> {note}
              </p>
            ))}
          </div>
        </motion.div>

        <div className="grid gap-4">
          {demoRoles.map(({ role, name, title, route, icon: Icon, tone, summary, checklist }, index) => (
            <motion.article key={role} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className={`rounded-xl border border-white/10 bg-gradient-to-br ${tone} p-5 shadow-sm backdrop-blur`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-md bg-white/80 text-rose dark:bg-white/10"><Icon size={22} /></span>
                    <div>
                      <h2 className="font-display text-2xl font-black">{title}</h2>
                      <p className="text-sm font-bold text-ink/60 dark:text-white/60">{name}</p>
                    </div>
                  </div>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/70 dark:text-white/70">{summary}</p>
                </div>
                <Button disabled={loadingRole === role} onClick={() => launchDemo(role, route)}>
                  {loadingRole === role ? 'Starting...' : 'Start demo'} <ArrowRight size={16} />
                </Button>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {checklist.map(([label, to, StepIcon]) => (
                  <Link key={label} to={to} onClick={(event) => { event.preventDefault(); launchDemo(role, to); }} className="focus-ring flex items-center gap-2 rounded-md border border-white/10 bg-white/40 px-3 py-2 text-sm font-black transition hover:-translate-y-0.5 hover:bg-white/70 dark:bg-white/10 dark:hover:bg-white/15">
                    <StepIcon size={16} className="text-rose" /> {label}
                  </Link>
                ))}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
      <div className="mt-6">
        <PortalSalonSearch title="Demo search for any Bengaluru salon" />
      </div>
    </section>
  );
}
