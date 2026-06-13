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
        color="#818cf8"
      />
      <Banner
        icon="🎵"
        label="Music Enjoyer"
        color="#34d399"
      />
      <Banner
        icon="🏍"
        label="Vroom Vroom"
        color="#fb923c"
      />
      <Banner
        icon="🏋"
        label="Gym Rat"
        color="#f43f5e"
      />
    </div>
  );
}

export default Banners;