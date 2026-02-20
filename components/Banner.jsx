function Banner({ icon, label, tone }) {
  return (
    <div className="relative flex-1 min-w-[100px] sm:min-w-[120px] overflow-hidden rounded-lg border border-zinc-700/30 bg-transparent backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-600/40 hover:bg-zinc-800/20">
      <div className={`pointer-events-none absolute inset-0 ${tone}`} />
      <div className="relative flex select-none flex-row items-center justify-center space-x-1.5 px-2 py-1.5 sm:px-2.5 sm:py-2">
        <span className="text-sm sm:text-base">{icon}</span>
        <span className="text-[10px] font-medium text-zinc-300 sm:text-[11px]">{label}</span>
      </div>
    </div>
  );
}

function Banners() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-center gap-1.5 sm:gap-2">
      <Banner
        icon="🎮"
        label="Gamer"
        tone="bg-indigo-400/5"
      />
      <Banner
        icon="🎵"
        label="Music Enjoyer"
        tone="bg-emerald-400/5"
      />
      <Banner
        icon="🏍"
        label="Vroom Vroom"
        tone="bg-orange-400/5"
      />
      <Banner
        icon="🏋"
        label="Gym Rat"
        tone="bg-rose-400/5"
      />
    </div>
  );
}

export default Banners;
