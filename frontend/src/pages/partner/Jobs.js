import React, { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Phone, MapPin, Navigation, IndianRupee, CheckCircle2 } from "lucide-react";
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

const ACTIVE_STATUSES = new Set(["accepted", "on_the_way", "started"]);

function buildMapsUrl(b) {
  if (b.lat != null && b.lng != null) return `https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}&travelmode=driving`;
  if (b.address) return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(b.address)}&travelmode=driving`;
  return null;
}

export default function Jobs() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("active");
  const [payFor, setPayFor] = useState(null);
  const [payForm, setPayForm] = useState({ method: "cash", ref: "" });
  const watchIdRef = useRef(null);
  const lastSendRef = useRef(0);

  const load = () => api.get("/bookings/mine").then((r)=>setItems(r.data));
  useEffect(() => { load(); }, []);

  // Live location: while partner has any active job, start watchPosition and POST every 10s
  useEffect(() => {
    const hasActive = items.some((b) => ACTIVE_STATUSES.has(b.status));
    if (!hasActive) {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }
    if (watchIdRef.current != null || !navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const now = Date.now();
        if (now - lastSendRef.current < 10000) return;
        lastSendRef.current = now;
        try {
          await api.post("/partner/location", { lat: pos.coords.latitude, lng: pos.coords.longitude });
        } catch { /* silently ignore */ }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [items]);

  const advance = async (b) => {
    const n = NEXT_BY_STATUS[b.status];
    if (!n) return;
    try { await api.post(`/bookings/${b.id}/status`, { status: n.next }); toast.success(`Updated to ${n.label}`); load(); }
    catch (e) { toast.error(formatError(e.response?.data?.detail)); }
  };

  const markPaid = async (bid) => {
    try {
      await api.post(`/partner/bookings/${bid}/mark-payment`, payForm);
      toast.success("Payment confirmed. Admin notified.");
      setPayFor(null); setPayForm({ method: "cash", ref: "" });
      load();
    } catch (e) { toast.error(formatError(e.response?.data?.detail)); }
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
                <div className="flex flex-col items-end gap-1">
                  <span className={`kh-chip ${statusColor[b.status]}`}>{b.status.replace("_"," ")}</span>
                  <span className={`kh-chip ${b.payment_status==="paid"?"bg-emerald-100 text-emerald-700":"bg-amber-100 text-amber-700"}`}>{b.payment_status==="paid"?"paid":"unpaid"}</span>
                </div>
              </div>
              <div className="mt-3 text-sm text-slate-600 flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 text-[#FF8A00]"/>{b.address}</div>
              {b.customer && (
                <div className="mt-2 text-sm text-slate-600 flex items-center gap-2"><Phone className="w-4 h-4 text-[#0F2D5C]"/>{b.customer.name} • {b.customer.phone || "—"}</div>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {ACTIVE_STATUSES.has(b.status) && buildMapsUrl(b) && (
                  <a href={buildMapsUrl(b)} target="_blank" rel="noopener noreferrer" data-testid={`job-navigate-${b.id}`} className="px-4 py-2 rounded-full bg-[#0F2D5C] text-white text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-[#0B244A] transition">
                    <Navigation className="w-4 h-4"/> Navigate
                  </a>
                )}
                {b.customer?.phone && ACTIVE_STATUSES.has(b.status) && (
                  <a href={`tel:${b.customer.phone}`} data-testid={`job-call-${b.id}`} className="kh-outline px-4 py-2 text-sm inline-flex items-center gap-1.5">
                    <Phone className="w-4 h-4"/> Call
                  </a>
                )}
                {NEXT_BY_STATUS[b.status] && (
                  <button onClick={()=>advance(b)} data-testid={`job-advance-${b.id}`} className="kh-cta px-4 py-2 text-sm">{NEXT_BY_STATUS[b.status].label}</button>
                )}
                {b.payment_status !== "paid" && b.status !== "cancelled" && (
                  <button onClick={()=>setPayFor(payFor === b.id ? null : b.id)} data-testid={`job-mark-paid-${b.id}`} className="px-4 py-2 rounded-full bg-emerald-500 text-white text-sm font-semibold inline-flex items-center gap-1.5">
                    <IndianRupee className="w-4 h-4"/>{payFor === b.id ? "Cancel" : "Mark Payment Received"}
                  </button>
                )}
              </div>

              {payFor === b.id && (
                <div className="mt-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-emerald-800">Confirm ₹{b.amount} received via:</span>
                  <select data-testid={`partner-pay-method-${b.id}`} value={payForm.method} onChange={(e)=>setPayForm({...payForm, method: e.target.value})} className="px-3 py-1.5 rounded-full border border-slate-200 text-sm">
                    <option value="cash">Cash</option>
                    <option value="qr">QR / UPI scan</option>
                    <option value="upi">UPI app</option>
                    <option value="other">Other</option>
                  </select>
                  <input data-testid={`partner-pay-ref-${b.id}`} value={payForm.ref} onChange={(e)=>setPayForm({...payForm, ref: e.target.value})} placeholder="Reference / UPI txn id (optional)" className="px-3 py-1.5 rounded-full border border-slate-200 text-sm flex-1 min-w-[200px]"/>
                  <button onClick={()=>markPaid(b.id)} data-testid={`partner-confirm-payment-${b.id}`} className="px-5 py-1.5 rounded-full bg-emerald-600 text-white text-sm font-semibold inline-flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/>Confirm</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
