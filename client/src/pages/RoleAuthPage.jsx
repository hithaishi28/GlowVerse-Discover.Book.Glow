import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Cake, KeyRound, LockKeyhole, Mail, PlayCircle, ShieldCheck, Store, UserRound, UsersRound } from 'lucide-react';
import { AnimatedBeautyBackground } from '../components/AnimatedBeautyBackground.jsx';
import { Button } from '../components/common/Button.jsx';
import { Logo } from '../components/common/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const roleConfig = {
  client: {
    role: 'user',
    title: 'Client Portal',
    loginLabel: 'Client Login',
    registerLabel: 'Client Sign Up',
    route: '/discover',
    icon: UserRound,
    email: 'demo@glowverse.app',
    copy: 'Book salons, save favorites, track bookings, rewards, gift cards, and quiz results.'
  },
  owner: {
    role: 'owner',
    title: 'Salon Owner Portal',
    loginLabel: 'Owner Login',
    registerLabel: 'Owner Registration',
    route: '/owner/dashboard',
    icon: Store,
    email: 'owner@glowverse.app',
    copy: 'Manage services, pricing, staff, appointments, revenue, reviews, and promotions.'
  },
  admin: {
    role: 'admin',
    title: 'Admin Portal',
    loginLabel: 'Admin Login',
    registerLabel: null,
    route: '/admin/dashboard',
    icon: ShieldCheck,
    email: 'admin@glowverse.app',
    copy: 'Manage platform approvals, moderation, analytics, users, salons, and bookings.'
  }
};

const genderOptions = [
  ['female', 'Female'],
  ['male', 'Male'],
  ['other', 'Other'],
  ['prefer_not_to_say', 'Prefer not to say']
];

export function RoleAuthPage() {
  const { portal = 'client' } = useParams();
  const config = roleConfig[portal] || roleConfig.client;
  const Icon = config.icon;
  const navigate = useNavigate();
  const { demoLogin, register, startDemoSession } = useAuth();
  const [mode, setMode] = useState(portal === 'client' ? 'register' : 'login');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ name: '', age: '', gender: '', email: portal === 'client' ? '' : config.email, password: 'Password123!' });

  const tabs = useMemo(() => {
    const base = [['login', config.loginLabel]];
    if (config.registerLabel) base.push(['register', config.registerLabel]);
    base.push(['forgot', 'Forgot Password']);
    return base;
  }, [config.loginLabel, config.registerLabel]);

  async function submit(event) {
    event.preventDefault();
    if (mode === 'forgot') {
      setMessage(`Password reset link prepared for ${form.email}.`);
      return;
    }
    if (mode === 'register') {
      const guestEmail = `${(form.name || 'guest').toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '') || 'guest'}.${Date.now()}@guest.glowverse.app`;
      await register({
        ...form,
        email: portal === 'client' && !form.email.trim() ? guestEmail : form.email,
        password: form.password || 'Password123!',
        role: config.role
      });
    } else {
      await demoLogin(config.role);
    }
    navigate(config.route);
  }

  function openExamplePortal() {
    startDemoSession(config.role);
    navigate(config.route);
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-ink text-white">
      <AnimatedBeautyBackground />
      <div className="section relative z-10 grid min-h-screen items-center gap-10 py-12 lg:grid-cols-[1fr_460px]">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
          <Logo />
          <Link to="/" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-white/70 hover:text-white"><ArrowLeft size={16} /> Choose another portal</Link>
          <div className="mt-8 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-gold backdrop-blur">
            <Icon size={16} className="mr-2" /> {config.title}
          </div>
          <h1 className="mt-5 font-display text-5xl font-black leading-tight">{config.loginLabel}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/72">{config.copy}</p>
        </motion.div>

        <motion.form initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl border border-white/15 bg-white/10 p-5 shadow-glow backdrop-blur-xl" onSubmit={submit}>
          <div className="flex rounded-md bg-white/10 p-1">
            {tabs.map(([key, label]) => (
              <button key={key} type="button" onClick={() => setMode(key)} className={`focus-ring min-h-11 flex-1 rounded-md px-2 text-sm font-black ${mode === key ? 'bg-white text-ink' : 'text-white/75'}`}>
                {label}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            {mode === 'register' && (
              <>
                <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm font-bold"><UserRound size={16} /> Name</span>
                    <input className="focus-ring h-12 w-full rounded-md border border-white/10 bg-white/10 px-3 text-white placeholder:text-white/45" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Your name" required />
                  </label>
                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm font-bold"><Cake size={16} /> Age</span>
                    <input className="focus-ring h-12 w-full rounded-md border border-white/10 bg-white/10 px-3 text-white placeholder:text-white/45" value={form.age} onChange={(event) => setForm({ ...form, age: event.target.value })} min="13" max="100" placeholder="27" type="number" required />
                  </label>
                </div>
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-bold"><UsersRound size={16} /> Gender</span>
                  <select className="focus-ring h-12 w-full rounded-md border border-white/10 bg-white/10 px-3 text-white" value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })} required>
                    <option className="text-ink" value="">Select gender</option>
                    {genderOptions.map(([value, label]) => <option className="text-ink" key={value} value={value}>{label}</option>)}
                  </select>
                </label>
              </>
            )}
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-bold"><Mail size={16} /> Email</span>
              <input className="focus-ring h-12 w-full rounded-md border border-white/10 bg-white/10 px-3 text-white placeholder:text-white/45" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder={portal === 'client' && mode === 'register' ? 'Optional' : 'you@example.com'} type="email" required={!(portal === 'client' && mode === 'register')} />
            </label>
            {mode !== 'forgot' && (
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-bold"><LockKeyhole size={16} /> Password</span>
                <input className="focus-ring h-12 w-full rounded-md border border-white/10 bg-white/10 px-3 text-white placeholder:text-white/45" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} type="password" required />
              </label>
            )}
            <Button className="w-full bg-rose text-white" type="submit">
              <KeyRound size={17} /> {mode === 'forgot' ? 'Send reset link' : mode === 'register' ? config.registerLabel : config.loginLabel} <ArrowRight size={17} />
            </Button>
            <Button className="w-full" variant="secondary" type="button" onClick={openExamplePortal}>
              <PlayCircle size={17} /> Open {config.role === 'user' ? 'Client' : config.role === 'owner' ? 'Owner' : 'Admin'} Example Portal
            </Button>
            {message && <p className="rounded-md bg-gold/15 p-3 text-sm font-bold text-gold">{message}</p>}
          </div>
        </motion.form>
      </div>
    </section>
  );
}
