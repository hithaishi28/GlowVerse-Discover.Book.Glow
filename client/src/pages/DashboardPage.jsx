import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Bell, Gift, Heart, Ticket, Trophy, UserRound } from 'lucide-react';
import { api } from '../api/client.js';
import { Button } from '../components/common/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const wheelRewards = ['Rs. 250 Coupon', '500 Points', 'Free Hair Spa', '15% Facial', 'VIP Slot', 'Nail Art Add-on', 'Glow Badge', '10% Makeup'];
const wheelColors = ['#ff7a18', '#ffd166', '#ef476f', '#06d6a0', '#118ab2', '#8338ec', '#fb5607', '#ffbe0b'];

function demoDashboard(user) {
  return {
    user: user || { name: 'Aarohi Sharma', age: 27, email: 'demo@glowverse.app', membershipTier: 'gold', rewardsPoints: 2450 },
    rewards: [
      { _id: 'r1', title: 'Glow Getter Badge' },
      { _id: 'r2', title: 'Rs. 250 Glow Coupon' },
      { _id: 'r3', title: '500 point milestone' }
    ],
    notifications: [
      { _id: 'n1', title: 'Booking confirmed' },
      { _id: 'n2', title: 'Reward unlocked' }
    ]
  };
}

export function DashboardPage() {
  const { user, demoLogin } = useAuth();
  const [data, setData] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [lastPrize, setLastPrize] = useState('');

  useEffect(() => {
    async function load() {
      const activeUser = user || await demoLogin('user');
      try {
        const response = await api.get('/experience/dashboard');
        setData(response.data);
      } catch {
        setData(demoDashboard(activeUser));
      }
    }
    load();
  }, [demoLogin, user]);

  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === 'owner') return <Navigate to="/owner/dashboard" replace />;

  async function spin() {
    if (spinning) return;
    const prizeIndex = Math.floor(Math.random() * wheelRewards.length);
    const targetRotation = rotation + 1440 + (360 - prizeIndex * (360 / wheelRewards.length));
    setSpinning(true);
    setRotation(targetRotation);
    try {
      const response = await api.post('/experience/spin');
      window.setTimeout(() => {
        setLastPrize(response.data.reward.title);
        setData((current) => ({ ...current, rewards: [response.data.reward, ...(current?.rewards || [])] }));
        setSpinning(false);
      }, 1200);
    } catch {
      const reward = { _id: `spin-${Date.now()}`, title: `Daily Spin: ${wheelRewards[prizeIndex]}` };
      window.setTimeout(() => {
        setLastPrize(reward.title);
        setData((current) => ({ ...current, rewards: [reward, ...(current?.rewards || [])] }));
        setSpinning(false);
      }, 1200);
    }
  }

  const cards = [
    ['Upcoming bookings', '3 confirmed appointments', Ticket],
    ['Saved salons', '12 premium spots', Heart],
    ['Rewards points', `${data?.user?.rewardsPoints || user?.rewardsPoints || 0} points`, Trophy],
    ['Notifications', `${data?.notifications?.length || 0} updates`, Bell]
  ];

  return (
    <section className="section py-10">
      <h1 className="font-display text-4xl font-black">{data?.user?.name || user?.name || 'Customer'} dashboard</h1>
      <div className="mt-6 grid gap-5 md:grid-cols-4">
        {cards.map(([title, value, Icon]) => <div key={title} className="rounded-xl border border-white/10 bg-white/10 p-5 shadow-glow backdrop-blur-xl"><Icon className="text-rose" /><p className="mt-4 text-sm text-ink/60 dark:text-white/60">{title}</p><p className="font-black">{value}</p></div>)}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-orange-500 via-rose to-gold p-6 text-white shadow-glow">
          <h2 className="flex items-center gap-2 font-display text-2xl font-black"><Gift className="text-white" /> Spin & Win</h2>
          <p className="mt-3 text-sm text-white/85">Spin the colorful GlowWheel for coupons, loyalty points, free add-ons, and membership boosts.</p>
          <div className="mt-6 grid gap-5 md:grid-cols-[260px_1fr] md:items-center">
            <div className="relative mx-auto grid h-64 w-64 place-items-center">
              <div className="absolute -left-2 top-1/2 z-10 h-0 w-0 -translate-y-1/2 border-y-[14px] border-l-[26px] border-y-transparent border-l-white drop-shadow" />
              <div
                className="grid h-56 w-56 place-items-center rounded-full border-[10px] border-white shadow-2xl transition-transform duration-1000 ease-out"
                style={{ transform: `rotate(${rotation}deg)`, background: `conic-gradient(${wheelColors.map((color, index) => `${color} ${index * 45}deg ${(index + 1) * 45}deg`).join(',')})` }}
              >
                <div className="grid h-20 w-20 place-items-center rounded-full border-4 border-white bg-ink text-center text-sm font-black text-white shadow-xl ring-4 ring-gold">SPIN</div>
              </div>
              {wheelRewards.map((reward, index) => (
                <span key={reward} className="absolute left-1/2 top-1/2 w-20 origin-left text-[10px] font-black text-white drop-shadow" style={{ transform: `rotate(${index * 45 + 14}deg) translateX(34px)` }}>{reward}</span>
              ))}
            </div>
            <div>
              <Button className="w-full bg-ink text-white ring-2 ring-white hover:bg-ink/90 dark:bg-white dark:text-ink" onClick={spin} disabled={spinning}>{spinning ? 'Spinning...' : 'Tap to Spin'}</Button>
              {lastPrize && <p className="mt-3 rounded-md bg-white/20 p-3 text-sm font-black">You won: {lastPrize}</p>}
              <div className="mt-4 space-y-2">{data?.rewards?.slice(0, 4).map((reward) => <p key={reward._id} className="rounded-md bg-white/15 p-3 text-sm font-bold">{reward.title}</p>)}</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/10 p-6 shadow-glow backdrop-blur-xl">
          <h2 className="flex items-center gap-2 font-display text-2xl font-black"><UserRound className="text-rose" /> Profile</h2>
          <p className="mt-4 font-bold">{data?.user?.name || user?.name}</p>
          <p className="text-sm text-ink/60 dark:text-white/60">{data?.user?.email || user?.email}</p>
          <p className="mt-2 text-sm font-bold text-ink/70 dark:text-white/70">Age: {data?.user?.age || user?.age || 'Not provided'}</p>
          <p className="mt-2 text-sm font-bold text-ink/70 dark:text-white/70">Gender: {data?.user?.gender || user?.gender || 'Not provided'}</p>
          <p className="mt-3 rounded-md bg-gold/15 p-3 text-sm font-bold text-gold">Membership: {data?.user?.membershipTier || user?.membershipTier}</p>
        </div>
      </div>
    </section>
  );
}
