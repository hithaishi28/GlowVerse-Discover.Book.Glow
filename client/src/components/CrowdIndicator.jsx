import { Activity, Clock3, UsersRound } from 'lucide-react';

const styles = {
  Closed: 'bg-ink/10 text-ink/65 dark:bg-white/10 dark:text-white/70',
  Low: 'bg-sage/15 text-sage',
  Moderate: 'bg-gold/15 text-gold',
  Busy: 'bg-rose/10 text-rose',
  Peak: 'bg-rose text-white'
};

export function CrowdIndicator({ crowd, compact = false }) {
  if (!crowd) return null;
  const isClosed = crowd.isOpen === false || crowd.level === 'Closed';
  return (
    <div className={`rounded-lg border border-white/10 bg-white/10 ${compact ? 'p-2' : 'p-4'} backdrop-blur-xl`}>
      <div className="flex items-center justify-between gap-3">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-black ${styles[crowd.level] || styles.Moderate}`}>
          <UsersRound size={13} /> {crowd.level}
        </span>
        <span className="text-xs font-bold text-ink/60 dark:text-white/60">
          {isClosed ? crowd.note : `${crowd.occupancy}% full`}
        </span>
      </div>
      {!compact && (
        <>
          {!isClosed && (
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/10 dark:bg-white/10">
              <div className="h-full rounded-full bg-rose" style={{ width: `${crowd.occupancy}%` }} />
            </div>
          )}
          <p className="mt-3 flex items-center gap-2 text-sm font-bold">
            <Clock3 size={15} /> {isClosed ? crowd.note : `Approx. ${crowd.waitMinutes} min wait`}
          </p>
          <p className="mt-1 flex items-center gap-2 text-xs text-ink/60 dark:text-white/60"><Activity size={13} /> {crowd.note} / {crowd.liveUpdatedAt}</p>
          {crowd.isAfterClose && <p className="mt-2 text-xs font-bold text-gold">Today's appointments: {crowd.todayBookings || 0}</p>}
          {crowd.bestVisitWindow && <p className="mt-2 text-xs font-bold text-sage">{isClosed ? 'Next available' : 'Best visit window'}: {crowd.bestVisitWindow}</p>}
          {crowd.confidence && <p className="mt-1 text-xs text-ink/55 dark:text-white/55">Crowd confidence: {crowd.confidence}%</p>}
        </>
      )}
    </div>
  );
}
