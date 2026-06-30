import React, { useEffect, useState } from "react";
import api from "@/lib/api";

const statusColor = {
  pending: "bg-slate-100 text-slate-600",
  accepted: "bg-blue-100 text-blue-700",
  on_the_way: "bg-amber-100 text-amber-700",
  started: "bg-orange-100 text-orange-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminBookings() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    api.get("/admin/bookings", { params: { status_filter: status || undefined } }).then((r)=>setItems(r.data));
  }, [status]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold" style={{fontFamily:"Outfit"}}>All Bookings</h1>
        <select data-testid="admin-bookings-filter" value={status} onChange={(e)=>setStatus(e.target.value)} className="px-4 py-2 rounded-full border border-slate-200 text-sm">
          <option value="">All statuses</option>
          {["pending","accepted","on_the_way","started","completed","cancelled"].map(s=><option key={s} value={s}>{s.replace("_"," ")}</option>)}
        </select>
      </div>
      <div className="rounded-2xl bg-white kh-shadow-card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>{["Service","Customer","Partner","Date","Amount","Status"].map((h)=><th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody>
            {items.map((b)=>(
              <tr key={b.id} data-testid={`admin-booking-row-${b.id}`} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-[#0F2D5C]">{b.service?.name}</td>
                <td className="px-4 py-3">{b.customer?.name}</td>
                <td className="px-4 py-3">{b.partner?.name || "—"}</td>
                <td className="px-4 py-3 text-slate-500">{b.date} {b.time}</td>
                <td className="px-4 py-3 font-semibold">₹{b.amount}</td>
                <td className="px-4 py-3"><span className={`kh-chip ${statusColor[b.status]}`}>{b.status.replace("_"," ")}</span></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan="6" className="px-4 py-10 text-center text-slate-500">No bookings.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
