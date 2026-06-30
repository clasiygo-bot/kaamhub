import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight } from "lucide-react";
import api from "@/lib/api";

const statusColor = {
  pending: "bg-slate-100 text-slate-600",
  accepted: "bg-blue-100 text-blue-700",
  on_the_way: "bg-amber-100 text-amber-700",
  started: "bg-orange-100 text-orange-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function Bookings() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => { api.get("/bookings/mine").then((r)=>setItems(r.data)); }, []);

  const shown = items.filter((b)=> filter==="all" ? true : filter==="active" ? !["completed","cancelled"].includes(b.status) : b.status==="completed");

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold" style={{fontFamily:"Outfit"}}>My Bookings</h1>
        <div className="flex gap-2">
          {[
            {k:"all",l:"All"},{k:"active",l:"Active"},{k:"completed",l:"Completed"}
          ].map((t)=>(
            <button key={t.k} data-testid={`bookings-filter-${t.k}`} onClick={()=>setFilter(t.k)} className={`px-4 py-1.5 rounded-full text-sm font-medium ${filter===t.k?"bg-[#0F2D5C] text-white":"bg-slate-100 text-slate-600"}`}>{t.l}</button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-3xl">
          <Calendar className="w-10 h-10 mx-auto text-slate-300"/>
          <div className="mt-3 text-slate-500">No bookings yet</div>
          <Link to="/customer" data-testid="bookings-empty-cta" className="kh-cta inline-block mt-5 px-5 py-2.5 text-sm">Book a service</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((b)=>(
            <Link to={`/customer/bookings/${b.id}`} key={b.id} data-testid={`booking-row-${b.id}`} className="flex items-center justify-between bg-white rounded-2xl p-4 kh-shadow-card hover:kh-shadow-hover transition">
              <div className="flex items-center gap-3">
                <img src={b.service?.image} alt="" className="w-14 h-14 rounded-xl object-cover"/>
                <div>
                  <div className="font-semibold text-[#0F2D5C]">{b.service?.name}</div>
                  <div className="text-xs text-slate-500">{b.date} • {b.time} • ₹{b.amount}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`kh-chip ${statusColor[b.status] || "bg-slate-100"}`}>{b.status.replace("_"," ")}</span>
                <ArrowRight className="w-4 h-4 text-slate-400"/>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
