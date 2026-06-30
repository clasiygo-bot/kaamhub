import React, { useEffect, useState } from "react";
import { Users, UserCog, ShieldCheck, ClipboardList, IndianRupee, Banknote, CheckCircle2, XCircle } from "lucide-react";
import api from "@/lib/api";

export default function AdminDashboard() {
  const [s, setS] = useState(null);
  useEffect(()=>{ api.get("/admin/stats").then((r)=>setS(r.data)); }, []);
  if (!s) return <div className="py-20 text-center text-slate-400">Loading…</div>;

  const kpis = [
    { icon: Users, label: "Customers", value: s.total_users, color: "#0F2D5C", testid: "kpi-customers" },
    { icon: UserCog, label: "Partners", value: s.total_partners, color: "#FF8A00", testid: "kpi-partners" },
    { icon: ShieldCheck, label: "Pending KYC", value: s.pending_verification, color: "#F59E0B", testid: "kpi-pending-kyc" },
    { icon: CheckCircle2, label: "Approved", value: s.approved_partners, color: "#10B981", testid: "kpi-approved" },
    { icon: XCircle, label: "Rejected", value: s.rejected_partners, color: "#EF4444", testid: "kpi-rejected" },
    { icon: ClipboardList, label: "Today's Bookings", value: s.today_bookings, color: "#0EA5E9", testid: "kpi-today-bookings" },
    { icon: IndianRupee, label: "Monthly Revenue", value: `₹${s.monthly_revenue}`, color: "#8B5CF6", testid: "kpi-revenue" },
    { icon: Banknote, label: "Pending Payouts", value: s.pending_withdrawals, color: "#F97316", testid: "kpi-payouts" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" style={{fontFamily:"Outfit"}}>Admin Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of KaamHub operations</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {kpis.map((k)=>(
          <div key={k.label} data-testid={k.testid} className="rounded-2xl bg-white kh-shadow-card p-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${k.color}15`, color: k.color }}>
              <k.icon className="w-5 h-5"/>
            </div>
            <div className="mt-4 text-sm text-slate-500">{k.label}</div>
            <div className="text-2xl font-bold text-[#0F2D5C] mt-1">{k.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
