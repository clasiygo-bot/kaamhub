import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import api, { formatError } from "@/lib/api";

export default function Onboarding() {
  const [partner, setPartner] = useState(null);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    full_name: "", phone: "", city: "", area: "",
    experience_years: 1, service_category: "Plumber",
    profile_photo: "", aadhaar_url: "", pan_url: "", selfie_url: "",
    bank_account: "", ifsc: "", upi_id: "",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/partner/me").then((r) => {
      setPartner(r.data);
      // hydrate form
      setForm((f)=>({ ...f,
        full_name: r.data.full_name || "", phone: r.data.phone || "",
        city: r.data.city || "", area: r.data.area || "",
        experience_years: r.data.experience_years || 1,
        service_category: r.data.service_category || "Plumber",
        profile_photo: r.data.profile_photo || "",
        aadhaar_url: r.data.aadhaar_url || "", pan_url: r.data.pan_url || "", selfie_url: r.data.selfie_url || "",
        bank_account: r.data.bank_account || "", ifsc: r.data.ifsc || "", upi_id: r.data.upi_id || "",
      }));
    });
    api.get("/categories").then((r)=>setCategories(r.data));
  }, []);

  const upd = (k, v) => setForm((f)=>({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/partner/profile", { ...form, experience_years: Number(form.experience_years) });
      toast.success("Profile submitted for review");
      const r = await api.get("/partner/me"); setPartner(r.data);
    } catch (e) { toast.error(formatError(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold" style={{fontFamily:"Outfit"}}>Partner profile</h1>
      <p className="text-slate-500 mt-1">Complete this form to get verified and start receiving bookings.</p>

      {partner && partner.status !== "incomplete" && (
        <div className={`mt-5 p-4 rounded-2xl text-sm font-medium ${
          partner.status === "approved" ? "bg-emerald-50 text-emerald-700" :
          partner.status === "rejected" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
        }`}>
          Status: <strong className="capitalize">{partner.status}</strong>
          {partner.status === "rejected" && partner.rejection_reason && <div className="mt-1 text-xs">{partner.rejection_reason}</div>}
        </div>
      )}

      <form onSubmit={submit} className="mt-6 rounded-3xl bg-white kh-shadow-card p-6 sm:p-8 space-y-4">
        <Section title="Personal Details">
          <TF label="Full Name" testid="onb-full-name" value={form.full_name} onChange={(v)=>upd("full_name",v)} required/>
          <TF label="Phone" testid="onb-phone" value={form.phone} onChange={(v)=>upd("phone",v)} required/>
          <TF label="City" testid="onb-city" value={form.city} onChange={(v)=>upd("city",v)} required/>
          <TF label="Area / Locality" testid="onb-area" value={form.area} onChange={(v)=>upd("area",v)} required/>
        </Section>

        <Section title="Work Details">
          <TF label="Experience (years)" testid="onb-experience" type="number" min="0" value={form.experience_years} onChange={(v)=>upd("experience_years",v)} required/>
          <div>
            <Label>Service Category</Label>
            <select data-testid="onb-category" value={form.service_category} onChange={(e)=>upd("service_category", e.target.value)} className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/20 outline-none">
              {categories.map((c)=><option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        </Section>

        <Section title="Documents (paste publicly-accessible image URLs)">
          <TF label="Profile Photo URL" testid="onb-photo" value={form.profile_photo} onChange={(v)=>upd("profile_photo",v)}/>
          <TF label="Aadhaar URL" testid="onb-aadhaar" value={form.aadhaar_url} onChange={(v)=>upd("aadhaar_url",v)} required/>
          <TF label="PAN URL" testid="onb-pan" value={form.pan_url} onChange={(v)=>upd("pan_url",v)} required/>
          <TF label="Selfie URL" testid="onb-selfie" value={form.selfie_url} onChange={(v)=>upd("selfie_url",v)} required/>
        </Section>

        <Section title="Payout Details">
          <TF label="Bank Account No." testid="onb-bank" value={form.bank_account} onChange={(v)=>upd("bank_account",v)}/>
          <TF label="IFSC Code" testid="onb-ifsc" value={form.ifsc} onChange={(v)=>upd("ifsc",v)}/>
          <TF label="UPI ID" testid="onb-upi" value={form.upi_id} onChange={(v)=>upd("upi_id",v)}/>
        </Section>

        <button disabled={busy} data-testid="onb-submit" className="kh-cta w-full py-3 mt-2 disabled:opacity-60">{busy?"Submitting…":"Submit for verification"}</button>
      </form>
    </div>
  );
}

const Section = ({title, children}) => (
  <div>
    <div className="text-xs font-bold uppercase tracking-wider text-[#FF8A00] mb-3">{title}</div>
    <div className="grid sm:grid-cols-2 gap-3">{children}</div>
  </div>
);

const Label = ({children}) => <label className="text-sm font-medium text-slate-700">{children}</label>;

const TF = ({label, testid, value, onChange, type="text", required, min}) => (
  <div>
    <Label>{label}{required && <span className="text-red-500">*</span>}</Label>
    <input data-testid={testid} type={type} min={min} required={required} value={value} onChange={(e)=>onChange(e.target.value)} className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/20 outline-none"/>
  </div>
);
