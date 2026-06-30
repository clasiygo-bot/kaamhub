import React from "react";
import { Link } from "react-router-dom";

export default function Logo({ size = "md", withTag = false, white = false }) {
  const sizes = {
    sm: { d: 28, t: "text-lg" },
    md: { d: 36, t: "text-xl" },
    lg: { d: 56, t: "text-3xl" },
    xl: { d: 84, t: "text-5xl" },
  };
  const s = sizes[size] || sizes.md;
  return (
    <Link to="/" data-testid="brand-logo" className="inline-flex items-center gap-2 select-none">
      <span
        className="inline-flex items-center justify-center rounded-2xl shadow-md"
        style={{
          width: s.d,
          height: s.d,
          background: "linear-gradient(135deg, #0F2D5C 0%, #1a3a73 100%)",
          color: "#FF8A00",
          fontFamily: "Outfit, sans-serif",
          fontWeight: 800,
          fontSize: s.d * 0.5,
          lineHeight: 1,
        }}
      >
        K
      </span>
      <span className={`font-semibold ${s.t}`} style={{ fontFamily: "Outfit, sans-serif", color: white ? "#fff" : "#0F2D5C" }}>
        Kaam<span style={{ color: "#FF8A00" }}>Hub</span>
      </span>
      {withTag && (
        <span className="hidden sm:inline text-xs ml-2" style={{ color: white ? "#fff" : "#64748B" }}>
          Har Kaam, Ab Hoga Aasaan!
        </span>
      )}
    </Link>
  );
}
