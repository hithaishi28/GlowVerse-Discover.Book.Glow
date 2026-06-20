import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from './common/Button.jsx';
import { submitQuiz } from '../api/client.js';
import { fallbackImages, fallbackSalons } from '../data/fallback.js';

const questions = [
  { key: 'faceShape', label: 'Face shape', options: ['Oval', 'Round', 'Heart', 'Square', 'Diamond'] },
  { key: 'hairType', label: 'Hair type', options: ['Straight', 'Wavy', 'Curly', 'Frizzy', 'Fine'] },
  { key: 'hairLength', label: 'Hair length', options: ['Short', 'Shoulder Length', 'Long', 'Very Long'] },
  { key: 'preference', label: 'Style preference', options: ['Minimal', 'Luxury', 'Trendy', 'Natural', 'Bold'] },
  { key: 'occasion', label: 'Occasion', options: ['Wedding', 'Party', 'Interview', 'Date Night', 'Corporate Event'] }
];

const imageMap = {
  Short: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=80',
  'Shoulder Length': 'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&w=900&q=80',
  Long: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=900&q=80',
  'Very Long': 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=900&q=80',
  Wedding: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80',
  Party: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=900&q=80',
  Interview: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=900&q=80',
  'Date Night': 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=900&q=80',
  'Corporate Event': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80'
};

function buildRecommendations(answers) {
  const faceAdvice = {
    Oval: 'soft layers and balanced volume',
    Round: 'face-lengthening layers with crown lift',
    Heart: 'chin-framing movement with soft ends',
    Square: 'soft waves to balance jaw definition',
    Diamond: 'side-swept texture and cheekbone framing'
  }[answers.faceShape] || 'balanced face-framing';
  const hairAdvice = {
    Straight: 'glass-hair gloss treatment',
    Wavy: 'wave-defining cut and hydration spa',
    Curly: 'curl-shaping cut with deep hydration',
    Frizzy: 'keratin smoothening with anti-frizz serum',
    Fine: 'volume cut with root-lift styling'
  }[answers.hairType] || 'custom hair consultation';
  const finish = answers.preference === 'Bold' ? 'statement finish' : answers.preference === 'Natural' ? 'skin-first natural finish' : answers.preference === 'Luxury' ? 'premium polished finish' : 'clean modern finish';
  const occasionPlan = answers.occasion === 'Wedding' ? 'bridal trial and long-wear makeup' : answers.occasion === 'Interview' ? 'subtle grooming and confidence styling' : `${answers.occasion?.toLowerCase()} ready beauty package`;
  const selectedSalon = fallbackSalons[(answers.faceShape?.length + answers.hairLength?.length + answers.preference?.length) % fallbackSalons.length];
  return {
    salon: selectedSalon,
    score: 86 + ((answers.hairType?.length || 0) % 10),
    cards: [
      {
        title: `${answers.hairLength} ${hairAdvice}`,
        image: imageMap[answers.hairLength] || fallbackImages[2],
        reason: `Designed for ${answers.hairType?.toLowerCase()} hair with ${faceAdvice}.`
      },
      {
        title: `${answers.preference} ${occasionPlan}`,
        image: imageMap[answers.occasion] || fallbackImages[3],
        reason: `Matches your ${answers.preference?.toLowerCase()} preference for ${answers.occasion?.toLowerCase()}.`
      },
      {
        title: `${answers.faceShape} face-shape styling map`,
        image: fallbackImages[(answers.faceShape?.length || 0) % fallbackImages.length],
        reason: `Recommended shape strategy: ${faceAdvice}, completed with a ${finish}.`
      }
    ]
  };
}

export function BeautyQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiResult, setApiResult] = useState(null);
  const question = questions[step];
  const canContinue = Boolean(answers[question.key]);
  const result = useMemo(() => apiResult || buildRecommendations(answers), [answers, apiResult]);

  async function next() {
    if (!canContinue) return;
    if (step === questions.length - 1) {
      setLoading(true);
      setError('');
      try {
        const data = await submitQuiz(answers);
        const fallbackResult = buildRecommendations(answers);
        setApiResult({
          ...fallbackResult,
          score: data.result?.aiMatchScore || fallbackResult.score,
          salon: data.salons?.[0] || fallbackResult.salon,
          backendProfile: data.result?.beautyProfile,
          backendRecommendations: data.result?.recommendations || []
        });
      } catch {
        setError('Live quiz recommendations are unavailable, so local matching was used.');
        setApiResult(null);
      } finally {
        setLoading(false);
      }
      setSubmitted(true);
      return;
    }
    setStep((current) => current + 1);
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/10 p-5 shadow-glow backdrop-blur-xl">
        <h2 className="flex items-center gap-2 font-display text-2xl font-black"><CheckCircle2 className="text-sage" /> Your Glow Profile</h2>
        <p className="mt-3 text-sm leading-6 text-ink/70 dark:text-white/70">{result.backendProfile || `AI Match Score: ${result.score}%. Your profile blends ${answers.preference} styling, ${answers.hairLength?.toLowerCase()} hair planning, and ${answers.occasion?.toLowerCase()} readiness.`}</p>
        {error && <p className="mt-3 rounded-md bg-gold/15 p-3 text-sm font-bold text-gold">{error}</p>}
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {result.cards.map((item) => (
            <article key={item.title} className="overflow-hidden rounded-lg bg-white dark:bg-ink/70">
              <img src={item.image} alt={item.title} className="h-36 w-full object-cover" />
              <div className="p-4">
                <h3 className="font-black">{item.title}</h3>
                <p className="mt-2 text-sm text-ink/65 dark:text-white/65">{item.reason}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-5 rounded-md bg-rose/10 p-4 text-sm font-bold text-rose">Recommended salon: {result.salon.name}, {result.salon.locality}</div>
        {result.backendRecommendations?.length > 0 && <div className="mt-5 rounded-md bg-gold/15 p-4 text-sm font-bold text-gold">{result.backendRecommendations.join(' / ')}</div>}
        <Button className="mt-5" variant="secondary" onClick={() => { setSubmitted(false); setStep(0); setAnswers({}); setApiResult(null); setError(''); }}>Retake quiz</Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/10 p-5 shadow-glow backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <h2 className="flex items-center gap-2 font-display text-2xl font-black"><Sparkles className="text-rose" /> Style Recommendation Quiz</h2>
        <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-black text-gold">{step + 1}/{questions.length}</span>
      </div>
      <p className="mt-4 text-sm font-bold text-ink/70 dark:text-white/70">{question.label}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {question.options.map((option) => (
          <button key={option} onClick={() => setAnswers({ ...answers, [question.key]: option })} className={`focus-ring rounded-md border p-4 text-left text-sm font-black transition ${answers[question.key] === option ? 'border-rose bg-rose text-white' : 'border-ink/10 bg-white dark:border-white/10 dark:bg-white/5'}`}>
            {option}
          </button>
        ))}
      </div>
      <div className="mt-5 flex justify-between gap-3">
        <Button variant="secondary" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}><ArrowLeft size={17} /> Back</Button>
        <Button disabled={!canContinue || loading} onClick={next}>{loading ? 'Loading...' : step === questions.length - 1 ? 'Show recommendations' : 'Next'} <ArrowRight size={17} /></Button>
      </div>
      {!canContinue && <p className="mt-3 text-sm font-semibold text-gold">Choose one answer to continue.</p>}
    </div>
  );
}
