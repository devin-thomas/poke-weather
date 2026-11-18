interface PokeballIconProps {
  className?: string;
}

/** Simple Poké Ball mark, drawn inline so it needs no image asset. */
export function PokeballIcon({ className = 'w-4 h-4' }: PokeballIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="11" fill="#FFFFFF" stroke="#111827" strokeWidth="1.5" />
      <path
        d="M1 12a11 11 0 0 1 22 0z"
        fill="#D93829"
        stroke="#111827"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <line x1="1" y1="12" x2="23" y2="12" stroke="#111827" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3.25" fill="#FFFFFF" stroke="#111827" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1.25" fill="#111827" />
    </svg>
  );
}

/** Small "Negative reading" label with a Pokéball, used next to negative temperatures. */
export function NegativeReadingBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900 text-white text-[11px] font-semibold tracking-wide uppercase whitespace-nowrap">
      <PokeballIcon className="w-3.5 h-3.5" />
      Negative
    </span>
  );
}
