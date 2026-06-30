import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Briefcase, Wallet, UserCog, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/Logo";

const items = [
  { to: "/partner", icon: LayoutDashboard, label: "Dashboard", testid: "nav-partner-dashboard", end: true },
  { to: "/partner/jobs", icon: Briefcase, label: "Jobs", testid: "nav-partner-jobs" },
  { to: "/partner/wallet", icon: Wallet, label: "Wallet", testid: "nav-partner-wallet" },
  { to: "/partner/onboarding", icon: UserCog, label: "Profile", testid: "nav-partner-profile" },
];

export default function PartnerLayout({ children }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-white pb-24 sm:pb-0">
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="hidden sm:inline kh-chip bg-orange-100 text-[#FF8A00]">Partner</span>
          </div>
          <nav className="hidden sm:flex items-center gap-1">
            {items.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.end}
                data-testid={it.testid}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-full text-sm font-medium transition ${
                    isActive ? "bg-[#0F2D5C] text-white" : "text-slate-600 hover:bg-slate-100"
                  }`
                }
              >
                {it.label}
              </NavLink>
            ))}
          </nav>
          <button
            data-testid="partner-logout-button"
            onClick={async () => { await logout(); nav("/login"); }}
            className="kh-outline px-3 py-1.5 text-sm flex items-center gap-1"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">{children}</main>

      <nav className="kh-bottom-nav fixed sm:hidden bottom-0 inset-x-0 z-30 grid grid-cols-4 h-16">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            data-testid={it.testid + "-mobile"}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 text-[11px] ${
                isActive ? "text-[#FF8A00]" : "text-slate-500"
              }`
            }
          >
            <it.icon className="w-5 h-5" />
            <span>{it.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
