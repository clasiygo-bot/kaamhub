import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Home, Calendar, LifeBuoy, User, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/Logo";

const items = [
  { to: "/customer", icon: Home, label: "Home", testid: "nav-customer-home", end: true },
  { to: "/customer/bookings", icon: Calendar, label: "Bookings", testid: "nav-customer-bookings" },
  { to: "/customer/support", icon: LifeBuoy, label: "Support", testid: "nav-customer-support" },
  { to: "/customer/profile", icon: User, label: "Profile", testid: "nav-customer-profile" },
];

export default function CustomerLayout({ children }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-white pb-24 sm:pb-0">
      {/* Top nav (desktop) */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo />
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
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-sm text-slate-500">Hi, {user?.name?.split(" ")[0] || "Guest"}</span>
            <button
              data-testid="customer-logout-button"
              onClick={async () => { await logout(); nav("/login"); }}
              className="kh-outline px-3 py-1.5 text-sm flex items-center gap-1"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">{children}</main>

      {/* Bottom nav (mobile) */}
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
