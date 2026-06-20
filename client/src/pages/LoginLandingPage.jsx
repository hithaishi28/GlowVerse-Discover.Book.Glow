import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlayCircle, ShieldCheck, Store, UserRound } from 'lucide-react';
import { AnimatedBeautyBackground } from '../components/AnimatedBeautyBackground.jsx';
import { Logo } from '../components/common/Logo.jsx';

const portals = [
  {
    title: 'Continue as Client',
    route: '/client/login',
    icon: UserRound,
    copy: 'Discover nearby salons, book appointments, save favorites, and earn rewards.'
  },
  {
    title: 'Continue as Salon Owner',
    route: '/owner/login',
    icon: Store,
    copy: 'Manage salon services, staff, appointments, pricing, promotions, and revenue.'
  },
  {
    title: 'Continue as Admin',
    route: '/admin/login',
    icon: ShieldCheck,
    copy: 'Oversee users, salon approvals, bookings, reviews, and platform analytics.'
  }
];

export function LoginLandingPage() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-ink text-white">
      <AnimatedBeautyBackground />
      <div className="section relative z-10 grid min-h-screen content-center gap-10 py-12">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
          <Logo />
          <p className="mt-10 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-gold backdrop-blur">Luxury beauty marketplace for Bengaluru</p>
          <h1 className="mt-5 font-display text-5xl font-black leading-tight sm:text-7xl">GlowVerse</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/76">Choose your portal to continue. Clients, salon owners, and admins now have cleanly separated authentication and dashboard paths.</p>
          <Link to="/demo" className="focus-ring mt-6 inline-flex min-h-12 items-center gap-2 rounded-md bg-gold px-5 py-3 text-sm font-black text-ink transition hover:-translate-y-0.5 hover:bg-gold/90">
            <PlayCircle size={18} /> Open guided demo portal
          </Link>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-3">
          {portals.map(({ title, route, icon: Icon, copy }) => (
            <Link key={route} to={route} className="focus-ring rounded-2xl border border-white/12 bg-white/10 p-6 shadow-glow backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/15">
              <Icon className="text-gold" size={32} />
              <h2 className="mt-5 text-2xl font-black">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-white/68">{copy}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
