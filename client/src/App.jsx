import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Footer } from './components/layout/Footer.jsx';
import { Navbar } from './components/layout/Navbar.jsx';
import { LoginLandingPage } from './pages/LoginLandingPage.jsx';
import { RoleAuthPage } from './pages/RoleAuthPage.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { SalonDetailsPage } from './pages/SalonDetailsPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { OwnerDashboardPage } from './pages/OwnerDashboardPage.jsx';
import { AdminDashboardPage } from './pages/AdminDashboardPage.jsx';
import { WishlistPage } from './pages/WishlistPage.jsx';
import { CartPage } from './pages/CartPage.jsx';
import { CheckoutPage } from './pages/CheckoutPage.jsx';
import { OrdersPage } from './pages/OrdersPage.jsx';
import { CustomerCarePage } from './pages/CustomerCarePage.jsx';
import { FaqPage } from './pages/FaqPage.jsx';
import { HelpCentrePage } from './pages/HelpCentrePage.jsx';
import { NotificationsPage } from './pages/NotificationsPage.jsx';
import { StaticInfoPage } from './pages/StaticInfoPage.jsx';
import { DemoPortalPage } from './pages/DemoPortalPage.jsx';
import { useAuth } from './context/AuthContext.jsx';

function RoleGate({ role, children }) {
  const { user } = useAuth();
  if (!user) {
    const portal = role === 'user' ? 'client' : role;
    return <Navigate to={`/${portal}/login`} replace />;
  }
  if (user.role !== role) {
    const fallback = user.role === 'admin' ? '/admin/dashboard' : user.role === 'owner' ? '/owner/dashboard' : '/client/dashboard';
    return <Navigate to={fallback} replace />;
  }
  return children;
}

export default function App() {
  const location = useLocation();
  const isAuthShell = location.pathname === '/' || /^\/(client|owner|admin)\/login$/.test(location.pathname);

  return (
    <div className="app-shell relative min-h-screen overflow-hidden bg-pearl text-ink dark:bg-ink dark:text-white">
      <div className="site-ambient-bg" aria-hidden="true" />
      {!isAuthShell && <Navbar />}
      <main className="relative z-10">
        <Routes>
          <Route path="/" element={<LoginLandingPage />} />
          <Route path="/demo" element={<DemoPortalPage />} />
          <Route path="/:portal/login" element={<RoleAuthPage />} />
          <Route path="/discover" element={<HomePage />} />
          <Route path="/salons/:slug" element={<SalonDetailsPage />} />
          <Route path="/client/dashboard" element={<RoleGate role="user"><DashboardPage /></RoleGate>} />
          <Route path="/client/wishlist" element={<RoleGate role="user"><WishlistPage /></RoleGate>} />
          <Route path="/client/cart" element={<RoleGate role="user"><CartPage /></RoleGate>} />
          <Route path="/client/checkout" element={<RoleGate role="user"><CheckoutPage /></RoleGate>} />
          <Route path="/client/orders" element={<RoleGate role="user"><OrdersPage /></RoleGate>} />
          <Route path="/client/customer-care" element={<RoleGate role="user"><CustomerCarePage /></RoleGate>} />
          <Route path="/client/faqs" element={<RoleGate role="user"><FaqPage /></RoleGate>} />
          <Route path="/client/help-centre" element={<RoleGate role="user"><HelpCentrePage /></RoleGate>} />
          <Route path="/client/notifications" element={<RoleGate role="user"><NotificationsPage /></RoleGate>} />
          <Route path="/client/settings" element={<RoleGate role="user"><StaticInfoPage title="Settings"><p>Manage theme, account preferences, and beauty preferences from your profile dashboard. Changes are saved with your GlowVerse account where supported.</p></StaticInfoPage></RoleGate>} />
          <Route path="/privacy" element={<StaticInfoPage title="Privacy Policy">
            <p>GlowVerse stores account, booking, wishlist, cart, support, notification, and preference data to operate the salon marketplace experience.</p>
            <p>Profile details such as name, phone, email, age, gender, and beauty preferences are used to personalize recommendations, bookings, invoices, and customer support.</p>
            <p>Salon discovery may use location or selected Bangalore area data to show relevant salons, availability, occupancy, offers, maps, and distance information.</p>
            <p>Booking records include selected salon, service, stylist, appointment date, slot, amount, status, cancellation status, and invoice details.</p>
            <p>Payment information is processed through payment providers. GlowVerse stores transaction references, method, status, paid amount, and invoice metadata, not sensitive card credentials.</p>
            <p>Wishlist, cart, orders, and notifications may be stored locally on the device in demo/offline mode so the preview remains usable when the backend is unavailable.</p>
            <p>Support messages, refund requests, live chat requests, and ticket updates may be visible to authorized admin/support users for resolution.</p>
            <p>Owner dashboards only show data connected to the owner salon, including bookings, customers, payments, reviews, services, offers, inventory, and analytics.</p>
            <p>Admin dashboards may access platform-level user, salon, booking, payment, support, moderation, category, banner, fraud, and settings data for operations and safety.</p>
            <p>GlowVerse uses reasonable technical controls in the application to keep records role-protected and to prevent one salon owner from viewing another salon's private records.</p>
            <p>You should use accurate account information and avoid sharing OTPs, payment references, or account access with others.</p>
            <p>Privacy questions, correction requests, or support concerns can be raised through Customer Care or Help Centre.</p>
          </StaticInfoPage>} />
          <Route path="/terms" element={<StaticInfoPage title="Terms & Conditions">
            <p>GlowVerse is a salon discovery, booking, payment, invoice, customer support, owner management, and admin operations platform.</p>
            <p>Bookings depend on salon operating hours, stylist availability, service duration, live capacity, selected slot, and successful payment confirmation.</p>
            <p>Users must provide accurate profile, contact, booking, and payment information so salons can deliver appointments and support can resolve requests.</p>
            <p>Confirmed bookings may be cancelled, rescheduled, or completed according to salon policy, timing, payment status, and platform rules.</p>
            <p>Prices, taxes, convenience fees, discounts, coupons, membership benefits, and package totals are shown before confirmation wherever available.</p>
            <p>Invoices are generated only for confirmed paid records or valid local demo confirmations and include salon, service, customer, payment, GST, and total details.</p>
            <p>Offers are salon-specific and may have start dates, end dates, eligible services, usage limits, and business restrictions.</p>
            <p>Owners are responsible for keeping their salon profile, photos, service prices, staff, availability, offers, inventory, and customer communication accurate.</p>
            <p>Admins may approve, suspend, verify, moderate, or remove salons, users, banners, categories, tickets, reviews, and suspicious activity to protect the platform.</p>
            <p>Users must communicate respectfully with salons, owners, and support. Abusive, fraudulent, or misleading activity may lead to account restrictions.</p>
            <p>GlowVerse may use demo/local preview behavior during development when backend services are unavailable, but production payments and database updates require the live backend.</p>
            <p>Continuing to use GlowVerse means you accept the booking, payment, invoice, cancellation, refund, support, and marketplace policies shown in the application.</p>
          </StaticInfoPage>} />
          <Route path="/owner/dashboard" element={<RoleGate role="owner"><OwnerDashboardPage /></RoleGate>} />
          <Route path="/admin/dashboard" element={<RoleGate role="admin"><AdminDashboardPage /></RoleGate>} />
          <Route path="/dashboard" element={<RoleGate role="user"><DashboardPage /></RoleGate>} />
          <Route path="/owner" element={<RoleGate role="owner"><OwnerDashboardPage /></RoleGate>} />
          <Route path="/admin" element={<RoleGate role="admin"><AdminDashboardPage /></RoleGate>} />
        </Routes>
      </main>
      {!isAuthShell && <Footer />}
    </div>
  );
}
