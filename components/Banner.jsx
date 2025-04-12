function Banner({ icon, label }) {
  return (
    <div 
      className="elegant-card glow-effect transform transition-all duration-300 hover:-translate-y-1 flex-1 min-w-[140px]"
    >
      <div className="flex select-none flex-row items-center justify-center space-x-2 px-3 py-1.5">
        <span className="text-lg">{icon}</span>
        <span className="text-xs font-medium text-zinc-300">{label}</span>
      </div>
    </div>
  );
}

function Banners() {
  return (
    <div className="mx-auto flex flex-wrap items-center justify-center gap-2 w-full max-w-3xl px-4">
      <Banner icon="🎮" label="Gamer" />
      <Banner icon="🎵" label="Music Enjoyer" />
      <Banner icon="🏍" label="Vroom Vroom" />
      <Banner icon="🏆" label="Achievement Hunter" />
    </div>
  );
}

export default Banners;