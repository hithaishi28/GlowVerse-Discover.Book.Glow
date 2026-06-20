import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Gem, Loader2, Send, Sparkles } from 'lucide-react';
import { askAssistant } from '../api/client.js';
import { Button } from './common/Button.jsx';
import { fallbackSalons } from '../data/fallback.js';

function parsePrompt(prompt) {
  const text = prompt.toLowerCase();
  const normalized = text.replace(/,/g, '');
  const budgetMatch = normalized.match(/(?:rs\.?|inr|under|below|budget|within)\s*([0-9]+(?:\.[0-9]+)?)\s*k?\b/) || normalized.match(/\b([0-9]+(?:\.[0-9]+)?)\s*k\b/) || normalized.match(/\b([0-9]{3,6})\b/);
  const rawBudget = Number(budgetMatch?.[1] || 3000);
  return {
    budget: Math.round(budgetMatch?.[0]?.includes('k') ? rawBudget * 1000 : rawBudget),
    occasion: ['bridal', 'wedding', 'party', 'interview', 'date night', 'date', 'corporate'].find((item) => text.includes(item)) || 'everyday glow',
    preferredService: ['hair spa', 'haircut', 'keratin', 'facial', 'cleanup', 'detan', 'makeup', 'spa', 'nail', 'skin', 'package'].find((item) => text.includes(item)) || 'beauty package',
    hairType: ['frizzy', 'curly', 'wavy', 'straight', 'fine', 'dry'].find((item) => text.includes(item)) || 'balanced',
    skinType: ['oily', 'dry', 'combination', 'sensitive', 'normal', 'acne'].find((item) => text.includes(item)) || 'normal',
    faceShape: ['oval', 'round', 'heart', 'square', 'diamond'].find((item) => text.includes(item)) || 'oval',
    concerns: ['frizz', 'dullness', 'tan', 'acne', 'pigmentation', 'hairfall', 'hair fall', 'dryness', 'dark spots'].filter((item) => text.includes(item))
  };
}

function hasBeautySignal(prompt) {
  const text = prompt.toLowerCase();
  return /\b(hair|skin|face|makeup|salon|budget|rs|inr|under|below|wedding|bridal|party|facial|keratin|spa|acne|tan|pigmentation|frizz|dry|oily|curly|round|oval|square)\b/.test(text);
}

function buildDynamicReply(prompt) {
  const intent = parsePrompt(prompt);
  const salonPool = fallbackSalons.slice(0, 3);
  const services = [
    intent.hairType === 'frizzy' ? 'Keratin smoothing with hair spa' : 'Face-shape haircut and gloss styling',
    intent.skinType === 'sensitive' ? 'Barrier repair facial' : 'Hydra glow facial',
    intent.occasion.includes('bridal') || intent.occasion.includes('wedding') ? 'Bridal makeup trial' : 'Soft glam makeup'
  ];
  return {
    message: `Here is a tailored GlowVerse plan for ${intent.occasion} within Rs. ${intent.budget.toLocaleString('en-IN')}.`,
    analysis: `I considered ${intent.hairType} hair, ${intent.skinType} skin, ${intent.faceShape} face shape, ${intent.concerns.length ? `${intent.concerns.join(', ')} concern(s), ` : ''}preferred ${intent.preferredService}, and your budget.`,
    recommendedServices: services,
    estimatedCost: Math.min(intent.budget, 2200),
    benefits: ['Personalized to your hair and skin profile.', 'Balances budget with visible results.', 'Includes salon-ready service sequencing.'],
    maintenanceRoutine: ['Use sunscreen daily after skin treatments.', 'Use sulfate-free shampoo after hair treatments.', 'Book maintenance in 4-6 weeks.'],
    recommendations: salonPool.map((salon, index) => ({
      type: index === 0 ? 'Best match' : index === 1 ? 'Budget match' : 'Premium match',
      title: salon.name,
      reason: `${salon.rating} star salon in ${salon.locality}, ${salon.distanceKm} km away, suitable for ${services[index % services.length].toLowerCase()}.`,
      score: Math.max(84, 97 - index * 5),
      price: Math.min(intent.budget, 1499 + index * 900)
    }))
  };
}

function ListSection({ title, items }) {
  if (!items?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-white/10 p-4">
      <p className="text-xs font-black uppercase text-gold">{title}</p>
      <ul className="mt-3 space-y-2 text-sm text-white/78">
        {items.map((item) => <li key={item}>- {item}</li>)}
      </ul>
    </div>
  );
}

export function AIAssistant() {
  const [prompt, setPrompt] = useState('Frizzy hair and sensitive skin under Rs. 2500 near Whitefield');
  const [reply, setReply] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [typed, setTyped] = useState('');
  const suggestions = ['Curly hair for round face under Rs. 2000', 'Oily skin facial near Indiranagar', 'Wedding makeup and hair package under Rs. 8000'];
  const assistantText = useMemo(() => reply?.message || 'Ask for salons, packages, services, stylists, budget ideas, or occasion-ready recommendations.', [reply]);

  useEffect(() => {
    setTyped('');
    let index = 0;
    const timer = setInterval(() => {
      index += 1;
      setTyped(assistantText.slice(0, index));
      if (index >= assistantText.length) clearInterval(timer);
    }, 14);
    return () => clearInterval(timer);
  }, [assistantText]);

  async function submit(event) {
    event.preventDefault();
    const cleanPrompt = prompt.trim();
    if (cleanPrompt.length < 3) {
      setError('Tell me your hair, skin, budget, concern, or occasion first.');
      return;
    }
    if (!hasBeautySignal(cleanPrompt)) {
      setReply({
        message: 'I can help, but I need one or two beauty details first.',
        analysis: 'Share your skin type, hair type, face shape, concern, preferred service, occasion, locality, or budget.',
        recommendedServices: [],
        estimatedCost: 0,
        benefits: ['Specific details make the recommendation personal and useful.'],
        maintenanceRoutine: [],
        recommendations: []
      });
      setError('Add a beauty concern, service, budget, or occasion to get a useful recommendation.');
      return;
    }
    setLoading(true);
    setError('');
    const nextHistory = [...history, { role: 'user', content: cleanPrompt }].slice(-8);
    try {
      const apiReply = await askAssistant(cleanPrompt, {
        history: nextHistory,
        preferences: parsePrompt(cleanPrompt)
      });
      const finalReply = apiReply?.recommendations?.length ? apiReply : buildDynamicReply(cleanPrompt);
      setReply(finalReply);
      setHistory([...nextHistory, { role: 'assistant', content: finalReply.message }].slice(-8));
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 350));
      const fallback = buildDynamicReply(cleanPrompt);
      setReply(fallback);
      setHistory([...nextHistory, { role: 'assistant', content: fallback.message }].slice(-8));
      setError('Live AI is unavailable, so I used GlowVerse local recommendations.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="overflow-hidden rounded-2xl border border-white/10 bg-ink text-white shadow-glow">
      <div className="relative p-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(190,52,85,.35),transparent_32%),radial-gradient(circle_at_82%_20%,rgba(197,151,74,.25),transparent_24%)]" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase text-gold"><Sparkles size={14} /> AI concierge</p>
              <h2 className="mt-4 flex items-center gap-2 font-display text-3xl font-black"><Bot className="text-gold" /> Beauty Assistant</h2>
            </div>
            <Gem className="text-rose" />
          </div>
          <div className="mt-5 rounded-xl border border-white/10 bg-white/10 p-4">
            <p className="min-h-12 text-sm leading-6 text-white/82">{typed}<span className="animate-pulse">|</span></p>
          </div>
          <form className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]" onSubmit={submit}>
            <input className="focus-ring min-h-12 rounded-md border border-white/10 bg-white/10 px-3 text-white placeholder:text-white/45" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Skin type, hair type, face shape, concern, budget..." />
            <Button className="bg-gold text-ink hover:bg-gold/90" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={17} /> : <Send size={17} />} Ask
            </Button>
          </form>
          {error && <p className="mt-3 rounded-md bg-gold/15 p-3 text-sm font-bold text-gold">{error}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((item) => (
              <button key={item} onClick={() => setPrompt(item)} className="focus-ring rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/75 hover:bg-white/15">
                {item}
              </button>
            ))}
          </div>
          {reply && (
            <div className="mt-5 grid gap-3">
              {reply.analysis && (
                <div className="rounded-xl border border-white/10 bg-white/10 p-4">
                  <p className="text-xs font-black uppercase text-gold">Analysis</p>
                  <p className="mt-2 text-sm text-white/76">{reply.analysis}</p>
                  {reply.estimatedCost && <p className="mt-3 text-sm font-black text-gold">Estimated cost: Rs. {Number(reply.estimatedCost).toLocaleString('en-IN')}</p>}
                </div>
              )}
              <ListSection title="Recommended services" items={reply.recommendedServices} />
              <ListSection title="Benefits" items={reply.benefits} />
              <ListSection title="Maintenance routine" items={reply.maintenanceRoutine} />
              {reply.recommendations?.map((item) => (
                <motion.div key={item.title} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className="rounded-xl border border-white/10 bg-white/10 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase text-gold">{item.type}</p>
                      <p className="mt-1 font-black">{item.title}</p>
                    </div>
                    <span className="rounded-full bg-sage/15 px-3 py-1 text-xs font-black text-sage">{item.score}% match</span>
                  </div>
                  <p className="mt-2 text-sm text-white/70">{item.reason}</p>
                  {item.price && <p className="mt-2 text-sm font-bold text-gold">Estimated from Rs. {item.price.toLocaleString('en-IN')}</p>}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
