import React, { useEffect, useState } from "react";

export default function Splash({ onDone }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      onDone && onDone();
    }, 2000);
    return () => clearTimeout(t);
  }, [onDone]);
  if (!visible) return null;
  return (
    <div
      data-testid="splash-screen"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(180deg, #0F2D5C 0%, #163b75 100%)" }}
    >
      <div className="kh-pop flex flex-col items-center">
        <div
          className="rounded-3xl shadow-2xl flex items-center justify-center"
          style={{
            width: 110, height: 110,
            background: "white",
            color: "#0F2D5C",
            fontFamily: "Outfit, sans-serif",
            fontWeight: 800,
            fontSize: 64,
          }}
        >
          K
        </div>
        <h1 className="mt-6 text-white text-4xl sm:text-5xl font-bold" style={{ fontFamily: "Outfit" }}>
          Kaam<span style={{ color: "#FF8A00" }}>Hub</span>
        </h1>
        <p className="mt-3 text-white/80 text-sm sm:text-base tracking-wide" style={{ fontFamily: "Manrope" }}>
          Har Kaam, Ab Hoga Aasaan!
        </p>
      </div>
    </div>
  );
}
