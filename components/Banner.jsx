function Banner({ icon, label, tone, glow }) {
  return (
    <div className="relative flex-1 min-w-[120px] sm:min-w-[140px] overflow-hidden rounded-xl border border-zinc-700/60 bg-zinc-900/82 shadow-[0_6px_18px_rgba(0,0,0,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-500/60">
      <div className="pointer-events-none absolute inset-0" style={{ background: glow }} />
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
      <Banner
        icon="🎮"
        label="Gamer"
        tone="from-indigo-400/18 via-indigo-300/5 to-transparent"
        glow="radial-gradient(circle at 15% 20%, rgba(129,140,248,0.14), transparent 55%)"
      />
      <Banner
        icon="🎵"
        label="Music Enjoyer"
        tone="from-emerald-400/18 via-emerald-300/5 to-transparent"
        glow="radial-gradient(circle at 15% 20%, rgba(52,211,153,0.13), transparent 55%)"
      />
      <Banner
        icon="🏍"
        label="Vroom Vroom"
        tone="from-orange-400/18 via-orange-300/5 to-transparent"
        glow="radial-gradient(circle at 15% 20%, rgba(251,146,60,0.12), transparent 55%)"
      />
      <Banner
        icon="🏋"
        label="Gym Rat"
        tone="from-rose-400/18 via-rose-300/5 to-transparent"
        glow="radial-gradient(circle at 15% 20%, rgba(251,113,133,0.12), transparent 55%)"
      />
    </div>
  );
}

export default Banners;
