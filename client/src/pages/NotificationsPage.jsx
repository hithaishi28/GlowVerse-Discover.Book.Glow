import { useEffect, useState } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { deleteNotification, fetchNotifications, markNotificationRead } from '../api/client.js';
import { Button } from '../components/common/Button.jsx';
import { EmptyState, ErrorState, LoadingState } from './customerUtils.jsx';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      const data = await fetchNotifications();
      setNotifications(data.notifications || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Notifications could not be loaded.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function markRead(id) {
    await markNotificationRead(id);
    load();
  }

  async function remove(id) {
    await deleteNotification(id);
    load();
  }

  if (loading) return <section className="section py-10"><LoadingState label="Loading notifications" /></section>;

  return (
    <section className="section py-10">
      <h1 className="flex items-center gap-2 font-display text-4xl font-black"><Bell className="text-rose" /> Notifications</h1>
      <ErrorState message={error} />
      {!notifications.length ? <EmptyState title="No notifications" body="Booking, payment, offer, and reminder updates will appear here." /> : (
        <div className="mt-6 space-y-3">{notifications.map((item) => (
          <div key={item._id} className={`rounded-xl p-4 shadow-glow ${item.read ? 'bg-white/5' : 'bg-white/15'}`}>
            <p className="font-black">{item.title}</p>
            <p className="text-sm text-ink/65 dark:text-white/65">{item.body}</p>
            <div className="mt-3 flex gap-2">
              {!item.read && <Button variant="secondary" onClick={() => markRead(item._id)}><Check size={16} /> Mark as read</Button>}
              <Button variant="ghost" onClick={() => remove(item._id)}><Trash2 size={16} /> Delete</Button>
            </div>
          </div>
        ))}</div>
      )}
    </section>
  );
}
