function Banner({ icon, label, tone }) {
  return (
    <div className="relative flex-1 min-w-[120px] sm:min-w-[140px] overflow-hidden rounded-xl border border-zinc-700/60 bg-zinc-900/80 shadow-[0_6px_18px_rgba(0,0,0,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-500/60">
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${tone} opacity-15`} />
      <div className="relative flex select-none flex-row items-center justify-center space-x-2 px-2 py-1.5 sm:px-3">
        <span className="text-base sm:text-lg">{icon}</span>
        <span className="text-[11px] font-medium text-zinc-200 sm:text-xs">{label}</span>
      </div>
    </div>
  );
}

function Banners() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-center gap-2 px-2 sm:px-4">
      <Banner icon="🎮" label="Gamer" tone="from-indigo-400/22 via-indigo-300/6 to-transparent" />
      <Banner icon="🎵" label="Music Enjoyer" tone="from-emerald-400/22 via-emerald-300/6 to-transparent" />
      <Banner icon="🏍" label="Vroom Vroom" tone="from-orange-400/22 via-orange-300/6 to-transparent" />
      <Banner icon="🏋" label="Gym Rat" tone="from-rose-400/22 via-rose-300/6 to-transparent" />
    </div>
  );
}

export default Banners;
