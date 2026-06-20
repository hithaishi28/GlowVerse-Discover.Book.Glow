import { Logo } from '../common/Logo.jsx';

export function Footer() {
  return (
    <footer className="mt-20 border-t border-ink/10 bg-white/60 py-10 dark:border-white/10 dark:bg-white/5">
      <div className="section grid gap-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-lg text-sm leading-6 text-ink/70 dark:text-white/70">
            A scalable beauty marketplace built for Bangalore first, ready for multi-city discovery, booking, memberships, rewards, and salon operations.
          </p>
        </div>
        <div>
          <h3 className="font-bold">Marketplace</h3>
          <p className="mt-3 text-sm text-ink/70 dark:text-white/70">Salons, stylists, services, offers, nearby discovery</p>
        </div>
        <div>
          <h3 className="font-bold">Platform</h3>
          <p className="mt-3 text-sm text-ink/70 dark:text-white/70">AI assistant, rewards, dashboards, analytics, payments</p>
        </div>
      </div>
    </footer>
  );
}
