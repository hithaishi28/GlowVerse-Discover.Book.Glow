export function Button({ children, className = '', variant = 'primary', ...props }) {
  const variants = {
    primary: 'bg-rose text-white hover:bg-rose/90',
    secondary: 'bg-white text-ink border border-ink/10 hover:bg-pearl dark:bg-white/10 dark:text-white dark:border-white/10',
    ghost: 'text-ink hover:bg-ink/5 dark:text-white dark:hover:bg-white/10'
  };
  return (
    <button
      className={`focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
