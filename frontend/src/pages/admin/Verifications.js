import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Eye } from "lucide-react";
import api, { formatError } from "@/lib/api";

export default function Verifications() {
  const [partners, setPartners] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [reasonFor, setReasonFor] = useState(null);
  const [reason, setReason] = useState("");

  const load = () => api.get("/admin/partners", { params: { status_filter: filter === "all" ? undefined : filter } }).then((r)=>setPartners(r.data));
  useEffect(()=>{ load(); }, [filter]);

  const verify = async (uid, action, reasonText) => {
    try {
      await api.post(`/admin/partners/${uid}/verify`, { action, reason: reasonText || "" });
      toast.success(action === "approve" ? "Partner approved" : "Partner rejected");
      setReasonFor(null); setReason("");
      load();
    } catch (e) { toast.error(formatError(e.response?.data?.detail)); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold" style={{fontFamily:"Outfit"}}>Partner Verifications</h1>
        <div className="flex gap-2">
          {["pending","approved","rejected","all"].map((s)=>(
            <button key={s} data-testid={`ver-filter-${s}`} onClick={()=>setFilter(s)} className={`px-4 py-1.5 rounded-full text-sm capitalize ${filter===s?"bg-[#0F2D5C] text-white":"bg-slate-100 text-slate-600"}`}>{s}</button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {partners.map((p)=>(
          <div key={p.id} data-testid={`partner-verify-card-${p.user_id}`} className="rounded-2xl bg-white kh-shadow-card p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#0F2D5C] text-white flex items-center justify-center font-bold">{p.user?.name?.[0]?.toUpperCase()}</div>
              <div>
                <div className="font-semibold text-[#0F2D5C]">{p.user?.name || p.full_name}</div>
                <div className="text-xs text-slate-500">{p.service_category} • {p.experience_years} yrs</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500 space-y-0.5">
              <div>📧 {p.user?.email}</div>
              <div>📞 {p.phone}</div>
              <div>📍 {p.city} • {p.area}</div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {["aadhaar_url","pan_url","selfie_url"].map((k)=>(
                p[k] ? <a key={k} href={p[k]} target="_blank" rel="noreferrer" data-testid={`doc-${k}-${p.user_id}`} className="block rounded-lg overflow-hidden bg-slate-100 aspect-square">
                  <img src={p[k]} alt={k} className="w-full h-full object-cover"/>
                </a> : <div key={k} className="rounded-lg bg-slate-50 aspect-square flex items-center justify-center text-[10px] text-slate-400">No {k.split('_')[0]}</div>
              ))}
            </div>
            <span className={`mt-3 inline-block kh-chip ${p.status==="approved"?"bg-emerald-100 text-emerald-700":p.status==="rejected"?"bg-red-100 text-red-700":"bg-amber-100 text-amber-700"}`}>{p.status}</span>
            <Link to={`/admin/users/${p.user_id}`} data-testid={`ver-view-${p.user_id}`} className="ml-2 text-xs px-3 py-1 rounded-full bg-[#0F2D5C] text-white inline-flex items-center gap-1"><Eye className="w-3 h-3"/>Full details</Link>
            {p.status === "pending" && (
              <div className="mt-3 flex gap-2">
                <button onClick={()=>verify(p.user_id, "approve")} data-testid={`ver-approve-${p.user_id}`} className="flex-1 kh-cta py-2 text-sm inline-flex items-center justify-center gap-1"><CheckCircle2 className="w-4 h-4"/>Approve</button>
                <button onClick={()=>setReasonFor(p.user_id)} data-testid={`ver-reject-${p.user_id}`} className="flex-1 py-2 rounded-full border border-red-200 text-red-600 text-sm inline-flex items-center justify-center gap-1 hover:bg-red-50"><XCircle className="w-4 h-4"/>Reject</button>
              </div>
            )}
            {reasonFor === p.user_id && (
              <div className="mt-3">
                <textarea data-testid={`ver-reason-input-${p.user_id}`} value={reason} onChange={(e)=>setReason(e.target.value)} placeholder="Reason for rejection" rows={2} className="w-full p-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#FF8A00]"/>
                <button onClick={()=>verify(p.user_id, "reject", reason)} data-testid={`ver-reject-confirm-${p.user_id}`} className="mt-2 w-full py-2 rounded-full bg-red-500 text-white text-sm">Confirm reject</button>
              </div>
            )}
          </div>
        ))}
        {partners.length === 0 && <div className="col-span-full text-center py-16 bg-slate-50 rounded-2xl text-slate-500">No partners in this state.</div>}
      </div>
    </div>
  );
}
