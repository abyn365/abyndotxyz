function Banner({ icon, label, tone }) {
  return (
    <div className="relative flex-1 min-w-[120px] sm:min-w-[140px] overflow-hidden rounded-xl border border-zinc-700/45 bg-zinc-900/45 shadow-[0_6px_18px_rgba(0,0,0,0.16)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-500/50">
      <div className={`pointer-events-none absolute inset-0 ${tone}`} />
      <div className="relative flex select-none flex-row items-center justify-center space-x-2 px-2 py-1.5 sm:px-3">
        <span className="text-base sm:text-lg">{icon}</span>
        <span className="text-[11px] font-medium text-zinc-200 sm:text-xs">{label}</span>
      </div>
    </div>
  );
}

function Banners() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-center gap-2 px-2 sm:px-4">
      <Banner
        icon="🎮"
        label="Gamer"
        tone="bg-indigo-400/8"
      />
      <Banner
        icon="🎵"
        label="Music Enjoyer"
        tone="bg-emerald-400/8"
      />
      <Banner
        icon="🏍"
        label="Vroom Vroom"
        tone="bg-orange-400/8"
      />
      <Banner
        icon="🏋"
        label="Gym Rat"
        tone="bg-rose-400/8"
      />
    </div>
  );
}

export default Banners;
