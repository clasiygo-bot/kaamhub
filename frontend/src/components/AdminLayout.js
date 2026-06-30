import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { BarChart3, ShieldCheck, ClipboardList, Banknote, Wrench, Users, Megaphone, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/Logo";

const items = [
  { to: "/admin", icon: BarChart3, label: "Dashboard", testid: "nav-admin-dashboard", end: true },
  { to: "/admin/verifications", icon: ShieldCheck, label: "Verifications", testid: "nav-admin-verifications" },
  { to: "/admin/bookings", icon: ClipboardList, label: "Bookings", testid: "nav-admin-bookings" },
  { to: "/admin/payouts", icon: Banknote, label: "Payouts", testid: "nav-admin-payouts" },
  { to: "/admin/services", icon: Wrench, label: "Services", testid: "nav-admin-services" },
  { to: "/admin/offers", icon: Megaphone, label: "Offers", testid: "nav-admin-offers" },
  { to: "/admin/users", icon: Users, label: "Users", testid: "nav-admin-users" },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-[#0F2D5C] text-white">
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center rounded-2xl w-9 h-9 bg-white text-[#0F2D5C] font-extrabold text-lg" style={{fontFamily:'Outfit'}}>K</span>
            <span className="text-lg font-semibold" style={{fontFamily:'Outfit'}}>Kaam<span className="text-[#FF8A00]">Hub</span></span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              data-testid={it.testid}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition ${
                  isActive ? "bg-[#FF8A00] text-white" : "text-white/80 hover:bg-white/10"
                }`
              }
            >
              <it.icon className="w-4 h-4" />
              {it.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className="text-xs text-white/60 mb-2">{user?.email}</div>
          <button
            data-testid="admin-logout-button"
            onClick={async () => { await logout(); nav("/login"); }}
            className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 transition rounded-full py-2 text-sm"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      <header className="lg:hidden sticky top-0 z-30 bg-[#0F2D5C] text-white h-14 flex items-center justify-between px-4">
        <Logo white />
        <button onClick={async () => { await logout(); nav("/login"); }} data-testid="admin-logout-button-mobile" className="text-white/80 text-xs flex items-center gap-1"><LogOut className="w-4 h-4"/>Logout</button>
      </header>

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-10">{children}</main>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 kh-bottom-nav grid grid-cols-5 h-14">
        {items.slice(0,5).map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            data-testid={it.testid + "-mobile"}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 text-[10px] ${
                isActive ? "text-[#FF8A00]" : "text-slate-600"
              }`
            }
          >
            <it.icon className="w-4 h-4" />
            <span>{it.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
