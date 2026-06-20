export function StaticInfoPage({ title, children }) {
  return (
    <section className="section py-10">
      <div className="rounded-xl bg-white/10 p-6 shadow-glow">
        <h1 className="font-display text-4xl font-black">{title}</h1>
        <div className="mt-5 space-y-3 text-sm leading-6 text-ink/70 dark:text-white/70">{children}</div>
      </div>
    </section>
  );
}
