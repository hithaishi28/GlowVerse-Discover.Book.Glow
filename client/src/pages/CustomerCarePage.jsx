import { useState } from 'react';
import { Headphones, MessageCircle, Phone } from 'lucide-react';
import { createSupportTicket } from '../api/client.js';
import { Button } from '../components/common/Button.jsx';
import { ErrorState } from './customerUtils.jsx';

export function CustomerCarePage() {
  const [form, setForm] = useState({ subject: '', category: 'booking', message: '' });
  const [chat, setChat] = useState('');
  const [chatMessages, setChatMessages] = useState([{ from: 'GlowVerse Care', text: 'Hi, I can help with bookings, payments, refunds, and invoices.' }]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setStatus('');
    try {
      await createSupportTicket(form);
      setStatus('Support ticket submitted. Our team will respond soon.');
      setForm({ subject: '', category: 'booking', message: '' });
    } catch (err) {
      const saved = JSON.parse(localStorage.getItem('glowverse_support_tickets') || '[]');
      localStorage.setItem('glowverse_support_tickets', JSON.stringify([{ ...form, _id: `ticket-${Date.now()}`, status: 'open', createdAt: new Date().toISOString() }, ...saved]));
      setStatus('Support ticket submitted in demo mode. It is saved locally until the backend is online.');
      setForm({ subject: '', category: 'booking', message: '' });
    } finally {
      setLoading(false);
    }
  }

  function sendChat(event) {
    event.preventDefault();
    if (!chat.trim()) return;
    const userText = chat.trim();
    setChatMessages((current) => [
      ...current,
      { from: 'You', text: userText },
      { from: 'GlowVerse Care', text: 'Thanks. I created a support note for this demo. For urgent payment or invoice issues, submit the form too.' }
    ]);
    setChat('');
  }

  return (
    <section className="section py-10">
      <h1 className="flex items-center gap-2 font-display text-4xl font-black"><Headphones className="text-rose" /> Customer Care</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <form onSubmit={submit} className="rounded-xl bg-white/10 p-6 shadow-glow">
          <ErrorState message={error} />
          {status && <p className="mb-4 rounded-md bg-sage/15 p-3 text-sm font-bold text-sage">{status}</p>}
          <div className="grid gap-4">
            <input className="focus-ring h-12 rounded-md border border-white/10 bg-white/10 px-3" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder="Subject" required />
            <select className="focus-ring h-12 rounded-md border border-white/10 bg-white/10 px-3" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
              <option className="bg-white text-ink" value="booking">Booking</option>
              <option className="bg-white text-ink" value="payment">Payment</option>
              <option className="bg-white text-ink" value="refund">Refund</option>
              <option className="bg-white text-ink" value="account">Account</option>
              <option className="bg-white text-ink" value="services">Services</option>
            </select>
            <textarea className="focus-ring min-h-40 rounded-md border border-white/10 bg-white/10 p-3" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="Tell us what happened" required />
            <Button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit'}</Button>
          </div>
        </form>
        <aside className="space-y-4">
          <div className="rounded-xl bg-white/10 p-5 shadow-glow">
            <MessageCircle className="text-gold" /><p className="mt-3 font-black">Live Chat</p><p className="mt-1 text-sm text-ink/60 dark:text-white/60">Working demo chat for instant guidance.</p>
            <div className="mt-3 max-h-56 space-y-2 overflow-auto rounded-lg bg-white/10 p-3">
              {chatMessages.map((item, index) => <p key={`${item.from}-${index}`} className="text-sm"><strong>{item.from}:</strong> {item.text}</p>)}
            </div>
            <form onSubmit={sendChat} className="mt-3 grid gap-2">
              <input className="focus-ring h-11 rounded-md border border-white/10 bg-white/10 px-3" value={chat} onChange={(event) => setChat(event.target.value)} placeholder="Type your message" />
              <Button type="submit">Send Chat</Button>
            </form>
          </div>
          <div className="rounded-xl bg-white/10 p-5 shadow-glow"><Phone className="text-sage" /><p className="mt-3 font-black">support@glowverse.app</p><p className="text-sm text-ink/60 dark:text-white/60">+91 80 4567 2026</p></div>
        </aside>
      </div>
    </section>
  );
}
