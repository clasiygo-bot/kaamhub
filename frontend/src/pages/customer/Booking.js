import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, MapPin, Calendar, Clock, NotebookPen, Check } from "lucide-react";
import api, { formatError } from "@/lib/api";

const steps = ["Address", "Date & Time", "Notes", "Review"];

export default function Booking() {
  const { id } = useParams();
  const nav = useNavigate();
  const [service, setService] = useState(null);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ address: "", date: "", time: "10:00", notes: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.get(`/services/${id}`).then(r=>setService(r.data)); }, [id]);

  // try detect location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const d = await resp.json();
          if (d && d.display_name) setForm((f)=>({ ...f, address: f.address || d.display_name, lat: latitude, lng: longitude }));
        } catch { /* noop */ }
      }, () => {}, { timeout: 5000 });
    }
  }, []);

  const next = () => {
    if (step === 0 && !form.address.trim()) return toast.error("Enter an address");
    if (step === 1 && (!form.date || !form.time)) return toast.error("Select date and time");
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/bookings", {
        service_id: id, address: form.address, lat: form.lat || null, lng: form.lng || null,
        date: form.date, time: form.time, notes: form.notes,
      });
      toast.success("Booking confirmed!");
      nav(`/customer/bookings/${data.id}`, { replace: true });
    } catch (e) {
      toast.error(formatError(e.response?.data?.detail) || e.message);
    } finally { setBusy(false); }
  };

  if (!service) return <div className="py-20 text-center text-slate-400">Loading…</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={()=>nav(-1)} data-testid="booking-back-button" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-[#0F2D5C] mb-4">
        <ArrowLeft className="w-4 h-4"/> Back
      </button>

      <div className="rounded-3xl bg-white kh-shadow-card p-4 flex items-center gap-3 mb-6">
        <img src={service.image} alt="" className="w-14 h-14 rounded-xl object-cover" />
        <div className="flex-1">
          <div className="font-semibold text-[#0F2D5C]">{service.name}</div>
          <div className="text-xs text-slate-500">{service.category} • {service.duration_min} min</div>
        </div>
        <div className="text-xl font-bold text-[#FF8A00]">₹{service.price}</div>
      </div>

      <div className="flex items-center gap-2 mb-6">
        {steps.map((s, i) => (
          <div key={s} className="flex-1 flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i<=step?"bg-[#FF8A00] text-white":"bg-slate-200 text-slate-500"}`}>{i<step?<Check className="w-3.5 h-3.5"/>:i+1}</div>
            <div className={`text-xs font-medium ${i<=step?"text-[#0F2D5C]":"text-slate-400"}`}>{s}</div>
            {i<steps.length-1 && <div className={`h-0.5 flex-1 ${i<step?"bg-[#FF8A00]":"bg-slate-200"}`}/>}
          </div>
        ))}
      </div>

      <div className="rounded-3xl bg-white kh-shadow-card p-6 sm:p-8">
        {step === 0 && (
          <div>
            <h2 className="text-xl font-bold mb-1" style={{fontFamily:"Outfit"}}>Service address</h2>
            <p className="text-sm text-slate-500 mb-4">Where should our partner come?</p>
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              <textarea
                data-testid="booking-address-input"
                value={form.address} onChange={(e)=>setForm({...form, address: e.target.value})}
                placeholder="House no, building, street, area, city, PIN"
                rows={3}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/20 outline-none resize-none"
              />
            </div>
          </div>
        )}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold mb-1" style={{fontFamily:"Outfit"}}>Pick date & time</h2>
            <p className="text-sm text-slate-500 mb-4">Choose a convenient slot</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-slate-400"/>
                <input data-testid="booking-date-input" type="date" min={new Date().toISOString().slice(0,10)} value={form.date} onChange={(e)=>setForm({...form,date:e.target.value})}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/20 outline-none"/>
              </div>
              <div className="relative">
                <Clock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400"/>
                <input data-testid="booking-time-input" type="time" value={form.time} onChange={(e)=>setForm({...form,time:e.target.value})}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/20 outline-none"/>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
              {["09:00","11:00","13:00","15:00","17:00","19:00"].map((t)=>(
                <button key={t} type="button" data-testid={`booking-time-slot-${t}`} onClick={()=>setForm({...form, time: t})} className={`py-2 rounded-full text-sm border ${form.time===t?"bg-[#0F2D5C] text-white border-[#0F2D5C]":"bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold mb-1" style={{fontFamily:"Outfit"}}>Any special instructions?</h2>
            <p className="text-sm text-slate-500 mb-4">Optional but helps the partner</p>
            <div className="relative">
              <NotebookPen className="absolute left-3 top-3.5 w-4 h-4 text-slate-400"/>
              <textarea data-testid="booking-notes-input" value={form.notes} onChange={(e)=>setForm({...form, notes: e.target.value})} rows={4} placeholder="e.g., gate code, parking, specific issue…"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/20 outline-none resize-none"/>
            </div>
          </div>
        )}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold mb-4" style={{fontFamily:"Outfit"}}>Review & confirm</h2>
            <div className="space-y-3 text-sm">
              <Row label="Service" value={service.name}/>
              <Row label="Address" value={form.address}/>
              <Row label="Date & Time" value={`${form.date} • ${form.time}`}/>
              {form.notes && <Row label="Notes" value={form.notes}/>}
              <Row label="Amount" value={<span className="font-bold text-[#FF8A00]">₹{service.price}</span>}/>
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <button onClick={prev} disabled={step===0} data-testid="booking-prev-button" className="kh-outline px-4 py-2 text-sm disabled:opacity-40">Back</button>
          {step < steps.length - 1 ? (
            <button onClick={next} data-testid="booking-next-button" className="kh-cta px-6 py-2.5 text-sm inline-flex items-center gap-1">Next <ArrowRight className="w-4 h-4"/></button>
          ) : (
            <button onClick={submit} disabled={busy} data-testid="booking-confirm-button" className="kh-cta px-6 py-2.5 text-sm">{busy?"Booking…":"Confirm booking"}</button>
          )}
        </div>
      </div>
    </div>
  );
}

const Row = ({label,value}) => (
  <div className="flex items-start justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
    <div className="text-slate-500">{label}</div>
    <div className="text-[#0F2D5C] font-medium text-right">{value}</div>
  </div>
);
