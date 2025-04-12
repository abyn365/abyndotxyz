function Banner({ icon, label }) {
  return (
    <div 
      className="elegant-card glow-effect transform transition-all duration-300 flex-1 min-w-[120px] sm:min-w-[140px]"
    >
      <div className="flex select-none flex-row items-center justify-center space-x-2 px-2 sm:px-3 py-1.5">
        <span className="text-base sm:text-lg">{icon}</span>
        <span className="text-[11px] sm:text-xs font-medium text-zinc-300">{label}</span>
      </div>
    </div>
  );
}

function Banners() {
  return (
    <div className="mx-auto flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 w-full max-w-3xl px-2 sm:px-4">
      <Banner icon="🎮" label="Gamer" />
      <Banner icon="🎵" label="Music Enjoyer" />
      <Banner icon="🏍" label="Vroom Vroom" />
      <Banner icon="🏆" label="Achievement Hunter" />
    </div>
  );
}

export default Banners;