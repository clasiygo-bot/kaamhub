import React from "react";

export default function BannerCarousel({ banners = [], testid = "banner-carousel" }) {
  const [i, setI] = React.useState(0);
  const active = banners.filter((b) => b.active !== false);
  React.useEffect(() => {
    if (active.length <= 1) return;
    const t = setInterval(() => setI((x) => (x + 1) % active.length), 5000);
    return () => clearInterval(t);
  }, [active.length]);
  if (active.length === 0) return null;
  const b = active[i];
  const inner = (
    <div className="relative rounded-3xl overflow-hidden aspect-[16/6] sm:aspect-[16/5] bg-slate-100">
      <img src={b.image} alt={b.title} className="w-full h-full object-cover"/>
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10 text-white">
        <div className="text-lg sm:text-2xl font-bold" style={{fontFamily:"Outfit"}}>{b.title}</div>
        {b.subtitle && <div className="mt-1 text-white/85 text-sm sm:text-base max-w-md line-clamp-2">{b.subtitle}</div>}
      </div>
      {active.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {active.map((_, idx) => (
            <button key={idx} data-testid={`${testid}-dot-${idx}`} onClick={()=>setI(idx)} className={`h-1.5 rounded-full transition-all ${idx===i?"w-6 bg-white":"w-1.5 bg-white/50"}`}/>
          ))}
        </div>
      )}
    </div>
  );
  return (
    <div data-testid={testid}>
      {b.link ? (
        b.link.startsWith("http") ? <a href={b.link} target="_blank" rel="noreferrer">{inner}</a>
        : <a href={b.link}>{inner}</a>
      ) : inner}
    </div>
  );
}
