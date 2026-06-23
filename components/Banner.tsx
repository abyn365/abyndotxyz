function Banner({ icon, label }: { icon: string; label: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)]">
      <span>{icon}</span>
      <span className="text-xs">{label}</span>
    </span>
  );
}

function Banners() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Banner icon="🎮" label="Gamer" color="#e4e4e7" />
      <Banner icon="🎵" label="Music Enjoyer" color="#a1a1aa" />
      <Banner icon="🏍" label="Vroom Vroom" color="#71717a" />
      <Banner icon="🏋" label="Gym Rat" color="#52525b" />
    </div>
  );
}

export default Banners;