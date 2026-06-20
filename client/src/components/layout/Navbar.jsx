import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, CircleHelp, FileQuestion, Heart, HelpCircle, LogIn, LogOut, Menu, Moon, PackageCheck, Shield, ShoppingCart, Sun, UserRound, X } from 'lucide-react';
import { Logo } from '../common/Logo.jsx';
import { Button } from '../common/Button.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { fetchCustomerSummary } from '../../api/client.js';
import { getLocalCart, getLocalWishlist } from '../../pages/customerUtils.jsx';

function Badge({ count }) {
  if (!count) return null;
  return <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose px-1 text-[10px] font-black text-white">{count}</span>;
}

export function Navbar() {
  const navigate = useNavigate();
  const { dark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState({ wishlistCount: 0, cartCount: 0, notificationCount: 0 });
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const links = user?.role === 'admin'
    ? [['/admin/dashboard', 'Admin Dashboard']]
    : user?.role === 'owner'
      ? [['/owner/dashboard', 'Owner Dashboard']]
      : [
          ['/discover', 'Discover'],
          ['/client/dashboard', 'Client Dashboard']
        ];

  useEffect(() => {
    if (user?.role !== 'user') return undefined;
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchCustomerSummary();
        if (!cancelled) setSummary(data);
      } catch {
        if (!cancelled) {
          const wishlist = getLocalWishlist();
          const cart = getLocalCart();
          setSummary({
            wishlistCount: (wishlist.salons?.length || 0) + (wishlist.services?.length || 0),
            cartCount: (cart.items || []).reduce((sum, item) => sum + Number(item.quantity || 1), 0),
            notificationCount: 0
          });
        }
      }
    }
    load();
    const timer = window.setInterval(load, 15000);
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    window.addEventListener('glowverse-local-customer-updated', onFocus);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('glowverse-local-customer-updated', onFocus);
    };
  }, [user?.role]);

  useEffect(() => {
    function closeOnOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    }
    function closeOnEsc(event) {
      if (event.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', closeOnOutside);
    document.addEventListener('keydown', closeOnEsc);
    return () => {
      document.removeEventListener('mousedown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEsc);
    };
  }, []);

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-pearl/90 backdrop-blur dark:border-white/10 dark:bg-ink/90">
      <nav className="section flex min-h-16 items-center justify-between gap-4">
        <Link to="/" className="focus-ring rounded-md">
          <Logo />
        </Link>
        <div className="hidden items-center gap-2 md:flex">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} className={({ isActive }) => `rounded-md px-3 py-2 text-sm font-semibold ${isActive ? 'bg-ink text-white dark:bg-white dark:text-ink' : 'text-ink/70 dark:text-white/70'}`}>
              {label}
            </NavLink>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" aria-label="Toggle theme" onClick={toggleTheme} className="w-11 px-0">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
          {user?.role === 'user' && (
            <>
              <Button variant="ghost" aria-label="Wishlist" onClick={() => navigate('/client/wishlist')} className="relative w-11 px-0"><Heart size={18} /><Badge count={summary.wishlistCount} /></Button>
              <Button variant="ghost" aria-label="Cart" onClick={() => navigate('/client/cart')} className="relative w-11 px-0"><ShoppingCart size={18} /><Badge count={summary.cartCount} /></Button>
            </>
          )}
          {user ? (
            <>
              <span className="hidden rounded-md bg-rose/10 px-3 py-2 text-xs font-black uppercase text-rose sm:inline">{user.role === 'user' ? user.name : user.role}</span>
              <Button variant="secondary" onClick={() => navigate(user.role === 'admin' ? '/admin/dashboard' : user.role === 'owner' ? '/owner/dashboard' : '/client/dashboard')}>
                <UserRound size={17} /> {user.name.split(' ')[0]}
              </Button>
              <Button onClick={handleLogout}>
                <LogOut size={17} /> Logout
              </Button>
              {user.role === 'user' && (
                <div className="relative" ref={menuRef}>
                  <Button variant="secondary" aria-label="Open menu" onClick={() => setMenuOpen((open) => !open)} className="w-11 px-0">
                    {menuOpen ? <X size={18} /> : <Menu size={18} />}
                  </Button>
                  {menuOpen && (
                    <div className="absolute right-0 top-14 z-50 w-72 overflow-hidden rounded-xl border border-white/10 bg-pearl shadow-glow dark:bg-ink">
                      {[
                        ['/client/dashboard', 'My Profile', UserRound],
                        ['/client/orders', 'Your Orders', PackageCheck],
                        ['/client/wishlist', 'Wishlist', Heart],
                        ['/client/cart', 'Cart', ShoppingCart],
                        ['/client/customer-care', 'Customer Care', HelpCircle],
                        ['/client/faqs', 'FAQs', FileQuestion],
                        ['/client/help-centre', 'Help Centre', CircleHelp],
                        ['/client/notifications', 'Notifications', Bell, summary.notificationCount],
                        ['/privacy', 'Privacy Policy', Shield],
                        ['/terms', 'Terms & Conditions', Shield]
                      ].map(([to, label, Icon, count]) => (
                        <button key={to} type="button" onClick={() => { setMenuOpen(false); navigate(to); }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold hover:bg-white/10">
                          <span className="relative"><Icon size={17} /> <Badge count={count} /></span>{label}
                        </button>
                      ))}
                      <button type="button" onClick={() => { setMenuOpen(false); handleLogout(); }} className="flex w-full items-center gap-3 border-t border-white/10 px-4 py-3 text-left text-sm font-bold text-rose hover:bg-rose/10">
                        <LogOut size={17} /> Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <Button onClick={() => navigate('/client/login')}>
              <LogIn size={17} /> Login / Sign Up
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
}
