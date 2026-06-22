function Banner({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <div
      className="badge-tag group"
      style={{
        '--tag-accent': color,
      } as React.CSSProperties}
    >
      <span className="text-sm">{icon}</span>
      <span className="text-[10px] font-medium">{label}</span>
    </div>
  );
}

function Banners() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Banner
        icon="🎮"
        label="Gamer"
        color="#e4e4e7"
      />
      <Banner
        icon="🎵"
        label="Music Enjoyer"
        color="#a1a1aa"
      />
      <Banner
        icon="🏍"
        label="Vroom Vroom"
        color="#71717a"
      />
      <Banner
        icon="🏋"
        label="Gym Rat"
        color="#52525b"
      />
    </div>
  );
}

export default Banners;