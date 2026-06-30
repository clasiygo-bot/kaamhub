import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import api, { formatError } from "@/lib/api";

export default function Payouts() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [utrFor, setUtrFor] = useState(null);
  const [utr, setUtr] = useState("");

  const load = () => api.get("/admin/withdrawals", { params: { status_filter: filter === "all" ? undefined : filter } }).then((r)=>setItems(r.data));
  useEffect(() => { load(); }, [filter]);

  const act = async (id, action, payload = {}) => {
    try { await api.post(`/admin/withdrawals/${id}/action`, { action, ...payload }); toast.success("Updated"); setUtrFor(null); setUtr(""); load(); }
    catch (e) { toast.error(formatError(e.response?.data?.detail)); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold" style={{fontFamily:"Outfit"}}>Payout Management</h1>
        <div className="flex gap-2">
          {["pending","approved","paid","rejected","all"].map((s)=>(
            <button key={s} data-testid={`payouts-filter-${s}`} onClick={()=>setFilter(s)} className={`px-4 py-1.5 rounded-full text-sm capitalize ${filter===s?"bg-[#0F2D5C] text-white":"bg-slate-100 text-slate-600"}`}>{s}</button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-white kh-shadow-card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>{["Partner","Amount","Status","UTR","Requested","Actions"].map((h)=><th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody>
            {items.map((w)=>(
              <tr key={w.id} className="border-t border-slate-100" data-testid={`payout-row-${w.id}`}>
                <td className="px-4 py-3"><div className="font-medium text-[#0F2D5C]">{w.user?.name}</div><div className="text-xs text-slate-500">{w.user?.email}</div></td>
                <td className="px-4 py-3 font-semibold">₹{w.amount}</td>
                <td className="px-4 py-3"><span className={`kh-chip ${w.status==="paid"?"bg-emerald-100 text-emerald-700":w.status==="rejected"?"bg-red-100 text-red-700":w.status==="approved"?"bg-blue-100 text-blue-700":"bg-amber-100 text-amber-700"}`}>{w.status}</span></td>
                <td className="px-4 py-3 text-xs">{w.utr || "—"}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{new Date(w.created_at).toLocaleString()}</td>
                <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                  {w.status === "pending" && (
                    <>
                      <button data-testid={`payout-approve-${w.id}`} onClick={()=>act(w.id, "approve")} className="text-xs px-3 py-1 rounded-full bg-blue-500 text-white">Approve</button>
                      <button data-testid={`payout-reject-${w.id}`} onClick={()=>act(w.id, "reject", { reason: "Rejected by admin" })} className="text-xs px-3 py-1 rounded-full bg-red-500 text-white">Reject</button>
                    </>
                  )}
                  {w.status === "approved" && (
                    utrFor === w.id ? (
                      <div className="flex gap-2 items-center">
                        <input data-testid={`payout-utr-input-${w.id}`} placeholder="UTR" value={utr} onChange={(e)=>setUtr(e.target.value)} className="px-2 py-1 border border-slate-200 rounded text-xs"/>
                        <button onClick={()=>act(w.id, "mark_paid", { utr })} data-testid={`payout-paid-confirm-${w.id}`} className="text-xs px-3 py-1 rounded-full bg-emerald-500 text-white">Save</button>
                      </div>
                    ) : (
                      <button onClick={()=>{ setUtrFor(w.id); setUtr(""); }} data-testid={`payout-mark-paid-${w.id}`} className="text-xs px-3 py-1 rounded-full bg-emerald-500 text-white">Mark Paid</button>
                    )
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan="6" className="px-4 py-10 text-center text-slate-500">No withdrawals.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
