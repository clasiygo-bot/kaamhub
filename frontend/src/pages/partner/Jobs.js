import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Phone, MapPin } from "lucide-react";
import api, { formatError } from "@/lib/api";

const NEXT_BY_STATUS = {
  accepted: { next: "on_the_way", label: "On the way" },
  on_the_way: { next: "started", label: "Start work" },
  started: { next: "completed", label: "Mark completed" },
};

const statusColor = {
  pending: "bg-slate-100 text-slate-600",
  accepted: "bg-blue-100 text-blue-700",
  on_the_way: "bg-amber-100 text-amber-700",
  started: "bg-orange-100 text-orange-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function Jobs() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("active");

  const load = () => api.get("/bookings/mine").then((r)=>setItems(r.data));
  useEffect(() => { load(); }, []);

  const advance = async (b) => {
    const n = NEXT_BY_STATUS[b.status];
    if (!n) return;
    try { await api.post(`/bookings/${b.id}/status`, { status: n.next }); toast.success(`Updated to ${n.label}`); load(); }
    catch (e) { toast.error(formatError(e.response?.data?.detail)); }
  };

  const shown = items.filter((b)=> {
    if (filter==="all") return true;
    if (filter==="active") return !["completed","cancelled"].includes(b.status);
    if (filter==="completed") return b.status==="completed";
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold" style={{fontFamily:"Outfit"}}>Jobs</h1>
        <div className="flex gap-2">
          {[{k:"active",l:"Active"},{k:"completed",l:"Completed"},{k:"all",l:"All"}].map((t)=>(
            <button key={t.k} data-testid={`jobs-filter-${t.k}`} onClick={()=>setFilter(t.k)} className={`px-4 py-1.5 rounded-full text-sm ${filter===t.k?"bg-[#0F2D5C] text-white":"bg-slate-100 text-slate-600"}`}>{t.l}</button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-3xl text-slate-500">Nothing to show.</div>
      ) : (
        <div className="space-y-3">
          {shown.map((b)=>(
            <div key={b.id} data-testid={`job-card-${b.id}`} className="rounded-2xl bg-white kh-shadow-card p-4">
              <div className="flex items-center gap-3">
                <img src={b.service?.image} alt="" className="w-14 h-14 rounded-xl object-cover"/>
                <div className="flex-1">
                  <div className="font-semibold text-[#0F2D5C]">{b.service?.name}</div>
                  <div className="text-xs text-slate-500">{b.date} • {b.time} • ₹{b.amount}</div>
                </div>
                <span className={`kh-chip ${statusColor[b.status]}`}>{b.status.replace("_"," ")}</span>
              </div>
              <div className="mt-3 text-sm text-slate-600 flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 text-[#FF8A00]"/>{b.address}</div>
              {b.customer && (
                <div className="mt-2 text-sm text-slate-600 flex items-center gap-2"><Phone className="w-4 h-4 text-[#0F2D5C]"/>{b.customer.name} • {b.customer.phone || "—"}</div>
              )}
              {NEXT_BY_STATUS[b.status] && (
                <button onClick={()=>advance(b)} data-testid={`job-advance-${b.id}`} className="kh-cta px-4 py-2 mt-3 text-sm w-full sm:w-auto">{NEXT_BY_STATUS[b.status].label}</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
