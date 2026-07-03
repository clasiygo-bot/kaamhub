import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Mail, Phone, Calendar, ShieldCheck, Save, Trash2, Power, Gift } from "lucide-react";
import api, { formatError } from "@/lib/api";

const statusColor = {
  pending: "bg-slate-100 text-slate-600",
  accepted: "bg-blue-100 text-blue-700",
  on_the_way: "bg-amber-100 text-amber-700",
  started: "bg-orange-100 text-orange-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminUserDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [edit, setEdit] = useState({ name: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const [bonusForm, setBonusForm] = useState({ amount: "", reason: "" });
  const [showBonus, setShowBonus] = useState(false);

  const load = () => api.get(`/admin/users/${id}`).then((r) => {
    setData(r.data);
    setEdit({ name: r.data.user.name, phone: r.data.user.phone || "" });
  });
  useEffect(() => { load(); }, [id]);

  const save = async () => {
    setBusy(true);
    try { await api.put(`/admin/users/${id}`, edit); toast.success("Saved"); load(); }
    catch (e) { toast.error(formatError(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };

  const toggle = async () => {
    try { await api.post(`/admin/users/${id}/toggle`); toast.success("Updated"); load(); }
    catch (e) { toast.error(formatError(e.response?.data?.detail)); }
  };

  const del = async () => {
    if (!confirm("Delete this user permanently?")) return;
    try { await api.delete(`/admin/users/${id}`); toast.success("Deleted"); nav("/admin/users"); }
    catch (e) { toast.error(formatError(e.response?.data?.detail)); }
  };

  const giveBonus = async () => {
    const amt = Number(bonusForm.amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (!bonusForm.reason.trim()) return toast.error("Enter a reason");
    try {
      await api.post(`/admin/partners/${id}/bonus`, { amount: amt, reason: bonusForm.reason });
      toast.success(`₹${amt} bonus credited to partner`);
      setShowBonus(false); setBonusForm({ amount: "", reason: "" });
      load();
    } catch (e) { toast.error(formatError(e.response?.data?.detail)); }
  };

  if (!data) return <div className="py-20 text-center text-slate-400">Loading…</div>;
  const u = data.user;

  return (
    <div className="space-y-6 max-w-5xl">
      <Link to="/admin/users" data-testid="user-detail-back" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-[#0F2D5C]"><ArrowLeft className="w-4 h-4"/>Back to users</Link>

      <div className="rounded-3xl bg-white kh-shadow-card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#0F2D5C] text-white flex items-center justify-center font-bold text-2xl">
              {u.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0F2D5C]" style={{fontFamily:"Outfit"}}>{u.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="kh-chip bg-orange-100 text-[#FF8A00] capitalize">{u.role}</span>
                <span className={`kh-chip ${u.active?"bg-emerald-100 text-emerald-700":"bg-red-100 text-red-700"}`}>{u.active?"Active":"Disabled"}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button data-testid="user-toggle-active" onClick={toggle} className="kh-outline px-4 py-2 text-sm inline-flex items-center gap-1"><Power className="w-4 h-4"/>{u.active?"Disable":"Enable"}</button>
            {u.role !== "admin" && (
              <button data-testid="user-delete-button" onClick={del} className="px-4 py-2 text-sm rounded-full border border-red-200 text-red-600 hover:bg-red-50 inline-flex items-center gap-1"><Trash2 className="w-4 h-4"/>Delete</button>
            )}
          </div>
        </div>

        <div className="mt-6 grid sm:grid-cols-3 gap-4">
          <InfoCard icon={Mail} label="Email" value={u.email}/>
          <InfoCard icon={Phone} label="Phone" value={u.phone || "—"}/>
          <InfoCard icon={Calendar} label="Joined" value={new Date(u.created_at).toLocaleDateString()}/>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6">
          <div className="text-xs font-bold uppercase tracking-wider text-[#FF8A00] mb-3">Edit details</div>
          <div className="grid sm:grid-cols-2 gap-3">
            <TF label="Name" testid="edit-name" value={edit.name} onChange={(v)=>setEdit({...edit, name: v})}/>
            <TF label="Phone" testid="edit-phone" value={edit.phone} onChange={(v)=>setEdit({...edit, phone: v})}/>
          </div>
          <button data-testid="save-user-button" onClick={save} disabled={busy} className="kh-cta mt-4 px-5 py-2 text-sm inline-flex items-center gap-1"><Save className="w-4 h-4"/>{busy?"Saving…":"Save changes"}</button>
        </div>
      </div>

      {/* Customer Stats */}
      {u.role === "customer" && data.stats && (
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Total bookings" value={data.stats.total_bookings}/>
          <Stat label="Completed" value={data.stats.completed}/>
          <Stat label="Total spent" value={`₹${data.stats.total_spent || 0}`} accent/>
        </div>
      )}

      {/* Partner profile + KYC docs */}
      {u.role === "partner" && data.partner && (
        <div className="rounded-3xl bg-white kh-shadow-card p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#FF8A00]"/>
              <h2 className="text-lg font-bold">KYC & Profile</h2>
            </div>
            <span className={`kh-chip ${data.partner.status==="approved"?"bg-emerald-100 text-emerald-700":data.partner.status==="rejected"?"bg-red-100 text-red-700":"bg-amber-100 text-amber-700"}`}>{data.partner.status}</span>
          </div>
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            <KV k="Full name" v={data.partner.full_name}/>
            <KV k="Phone" v={data.partner.phone}/>
            <KV k="City" v={data.partner.city}/>
            <KV k="Area" v={data.partner.area}/>
            <KV k="Category" v={data.partner.service_category}/>
            <KV k="Experience" v={`${data.partner.experience_years || 0} yrs`}/>
            <KV k="Bank A/c" v={data.partner.bank_account || "—"}/>
            <KV k="IFSC" v={data.partner.ifsc || "—"}/>
            <KV k="UPI ID" v={data.partner.upi_id || "—"}/>
            <KV k="Online" v={data.partner.online ? "Yes" : "No"}/>
            <KV k="Rating" v={`${data.partner.rating_avg?.toFixed(1) || "—"} (${data.partner.rating_count || 0})`}/>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {["aadhaar_url","pan_url","selfie_url"].map((k)=>(
              data.partner[k] ? (
                <a key={k} href={data.partner[k]} target="_blank" rel="noreferrer" data-testid={`doc-${k}`} className="block rounded-xl overflow-hidden bg-slate-100 aspect-[4/3]">
                  <img src={data.partner[k]} alt={k} className="w-full h-full object-cover"/>
                </a>
              ) : (
                <div key={k} className="rounded-xl bg-slate-50 aspect-[4/3] flex items-center justify-center text-xs text-slate-400 capitalize">No {k.split('_')[0]}</div>
              )
            ))}
          </div>
          {data.partner.status === "pending" && (
            <Link to="/admin/verifications" data-testid="goto-verifications" className="mt-4 inline-block kh-cta px-5 py-2 text-sm">Go to verification queue</Link>
          )}
        </div>
      )}

      {/* Partner wallet */}
      {u.role === "partner" && data.wallet && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Wallet balance" value={`₹${data.wallet.balance || 0}`} accent/>
            <Stat label="Total earned" value={`₹${data.wallet.total_earned || 0}`}/>
          </div>
          <div className="rounded-3xl bg-white kh-shadow-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-[#FF8A00]"/>
                <h2 className="text-lg font-bold">Give bonus</h2>
              </div>
              <button data-testid="toggle-bonus-form" onClick={()=>setShowBonus(!showBonus)} className="kh-outline px-4 py-1.5 text-xs">{showBonus?"Cancel":"Credit bonus"}</button>
            </div>
            {showBonus && (
              <div className="mt-4 grid sm:grid-cols-2 gap-3">
                <input data-testid="bonus-amount-input" type="number" min="1" value={bonusForm.amount} onChange={(e)=>setBonusForm({...bonusForm, amount: e.target.value})} placeholder="Amount ₹" className="px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#FF8A00]"/>
                <input data-testid="bonus-reason-input" value={bonusForm.reason} onChange={(e)=>setBonusForm({...bonusForm, reason: e.target.value})} placeholder="Reason (e.g. Top-rated partner)" className="px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#FF8A00]"/>
                <button data-testid="submit-bonus-button" onClick={giveBonus} className="kh-cta py-2.5 sm:col-span-2">Credit ₹{bonusForm.amount || "0"} to partner wallet</button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Bookings */}
      <div className="rounded-3xl bg-white kh-shadow-card overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold" style={{fontFamily:"Outfit"}}>Bookings ({data.bookings?.length || 0})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>{["Service","Date","Amount","Status","Payment"].map((h)=><th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody>
              {(data.bookings || []).map((b)=>(
                <tr key={b.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-[#0F2D5C]">{b.service?.name}</td>
                  <td className="px-4 py-3 text-slate-500">{b.date} {b.time}</td>
                  <td className="px-4 py-3 font-semibold">₹{b.amount}</td>
                  <td className="px-4 py-3"><span className={`kh-chip ${statusColor[b.status]}`}>{b.status.replace("_"," ")}</span></td>
                  <td className="px-4 py-3"><span className={`kh-chip ${b.payment_status==="paid"?"bg-emerald-100 text-emerald-700":"bg-amber-100 text-amber-700"}`}>{b.payment_status || "unpaid"}</span></td>
                </tr>
              ))}
              {(!data.bookings || data.bookings.length === 0) && <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-500">No bookings.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Partner withdrawals */}
      {u.role === "partner" && data.withdrawals && data.withdrawals.length > 0 && (
        <div className="rounded-3xl bg-white kh-shadow-card overflow-hidden">
          <div className="p-6 border-b border-slate-100"><h2 className="text-lg font-bold">Withdrawal history</h2></div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-left"><tr>{["Amount","Status","UTR","Requested"].map((h)=><th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
              <tbody>
                {data.withdrawals.map((w)=>(
                  <tr key={w.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-semibold">₹{w.amount}</td>
                    <td className="px-4 py-3"><span className={`kh-chip ${w.status==="paid"?"bg-emerald-100 text-emerald-700":w.status==="rejected"?"bg-red-100 text-red-700":w.status==="approved"?"bg-blue-100 text-blue-700":"bg-amber-100 text-amber-700"}`}>{w.status}</span></td>
                    <td className="px-4 py-3 text-xs">{w.utr || "—"}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{new Date(w.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const InfoCard = ({ icon: Icon, label, value }) => (
  <div className="rounded-2xl bg-slate-50 p-4">
    <div className="flex items-center gap-2 text-xs text-slate-500"><Icon className="w-3.5 h-3.5"/>{label}</div>
    <div className="mt-1 font-medium text-[#0F2D5C] break-all">{value}</div>
  </div>
);
const Stat = ({ label, value, accent }) => (
  <div className={`rounded-2xl p-5 kh-shadow-card ${accent?"bg-[#FF8A00] text-white":"bg-white"}`}>
    <div className={`text-sm ${accent?"text-white/80":"text-slate-500"}`}>{label}</div>
    <div className={`mt-1 text-2xl font-bold ${accent?"text-white":"text-[#0F2D5C]"}`}>{value}</div>
  </div>
);
const KV = ({k, v}) => (<div><div className="text-xs text-slate-500">{k}</div><div className="text-[#0F2D5C] font-medium break-all">{v || "—"}</div></div>);
const TF = ({label, testid, value, onChange}) => (
  <div>
    <label className="text-sm font-medium text-slate-700">{label}</label>
    <input data-testid={testid} value={value} onChange={(e)=>onChange(e.target.value)} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/20 outline-none"/>
  </div>
);
