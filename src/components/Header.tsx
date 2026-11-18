import { LocateFixed, Loader2 } from 'lucide-react';

interface HeaderProps {
  onLocateMe: () => void;
  isLocating: boolean;
}

export function Header({ onLocateMe, isLocating }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#F6F7F9]/92 backdrop-blur-md border-b border-slate-200/90">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D93829] rounded"
        >
          Poke Weather
        </a>

        {/* Zone 2: Clean single-line navigation links */}
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
        >
          <a
            href="#today"
            className="hover:text-slate-900 hover:underline underline-offset-4 decoration-slate-300 transition-colors whitespace-nowrap shrink-0"
          >
            Today
          </a>
          <a
            href="#daily-range"
            className="hover:text-slate-900 hover:underline underline-offset-4 decoration-slate-300 transition-colors whitespace-nowrap shrink-0"
          >
            High &amp; Low
          </a>
          <a
            href="#forecast"
            className="hover:text-slate-900 hover:underline underline-offset-4 decoration-slate-300 transition-colors whitespace-nowrap shrink-0"
          >
            7-Day Forecast
          </a>
          <a
            href="#how-it-maps"
            className="hover:text-slate-900 hover:underline underline-offset-4 decoration-slate-300 transition-colors whitespace-nowrap shrink-0"
          >
            How It Maps
          </a>
        </nav>

        {/* Zone 3: Single primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onLocateMe}
            disabled={isLocating}
            className="inline-flex items-center justify-center gap-2 min-h-[40px] px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:opacity-60 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#D93829]"
          >
            {isLocating ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <LocateFixed className="w-4 h-4" aria-hidden="true" />
            )}
            <span>{isLocating ? 'Locating…' : 'Use My Location'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
