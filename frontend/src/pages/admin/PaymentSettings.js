import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, QrCode, Smartphone, CreditCard, ShieldCheck, Upload } from "lucide-react";
import api, { formatError } from "@/lib/api";
import { readFileAsDataURL } from "@/lib/file";

export default function PaymentSettings() {
  const [s, setS] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => api.get("/admin/payment-settings").then((r) => setS(r.data));
  useEffect(() => { load(); }, []);

  const save = async () => {
    setBusy(true);
    try {
      await api.put("/admin/payment-settings", s);
      toast.success("Payment settings saved");
      load();
    } catch (e) { toast.error(formatError(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };

  if (!s) return <div className="py-20 text-center text-slate-400">Loading…</div>;
  const set = (k, v) => setS({ ...s, [k]: v });

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{fontFamily:"Outfit"}}>Payment Settings</h1>
          <p className="text-slate-500 mt-1">Configure the payment methods customers see at checkout.</p>
        </div>
        <button data-testid="payment-settings-save" onClick={save} disabled={busy} className="kh-cta px-5 py-2.5 text-sm inline-flex items-center gap-1.5"><Save className="w-4 h-4"/>{busy?"Saving…":"Save"}</button>
      </div>

      {/* UPI QR */}
      <Card icon={QrCode} title="Manual UPI QR" desc="Upload your own UPI QR image. Customer scans + pays, partner confirms on completion.">
        <Toggle testid="toggle-qr" label="Enable QR payment" value={s.enable_qr} onChange={(v)=>set("enable_qr", v)}/>
        <TF label="QR image URL (optional)" testid="qr-image-url" value={s.qr_image_url} onChange={(v)=>set("qr_image_url",v)} placeholder="https://…/my-qr.png"/>
        <div>
          <label className="text-sm font-medium text-slate-700">Or upload QR from your phone</label>
          <label className="mt-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#FF8A00] cursor-pointer transition">
            <Upload className="w-4 h-4 text-slate-500"/>
            <span className="text-sm text-slate-600">Choose QR image (jpg/png)</span>
            <input
              data-testid="qr-image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const dataUrl = await readFileAsDataURL(file, { maxWidth: 900, quality: 0.9 });
                  set("qr_image_url", dataUrl);
                  toast.success("QR loaded — click Save to activate");
                } catch (err) { toast.error(err.message || "Could not read file"); }
                e.target.value = "";
              }}
            />
          </label>
        </div>
        {s.qr_image_url && <img src={s.qr_image_url} alt="QR preview" className="mt-3 w-40 h-40 object-contain border border-slate-200 rounded-xl bg-white p-2"/>}
      </Card>

      {/* UPI Intent */}
      <Card icon={Smartphone} title="UPI Intent / Deeplink" desc="Customer taps button → UPI app opens with your VPA + amount pre-filled. No fees.">
        <Toggle testid="toggle-upi" label="Enable UPI intent" value={s.enable_upi_intent} onChange={(v)=>set("enable_upi_intent", v)}/>
        <TF label="UPI ID (VPA)" testid="upi-id" value={s.upi_id} onChange={(v)=>set("upi_id",v)} placeholder="yourname@upi"/>
        <TF label="Payee name" testid="upi-payee-name" value={s.upi_payee_name} onChange={(v)=>set("upi_payee_name",v)} placeholder="KaamHub"/>
      </Card>

      {/* Cashfree */}
      <Card icon={CreditCard} title="Cashfree Payment Gateway" desc="Hosted checkout — cards, netbanking, UPI, wallets. Customer pays online; auto-marked paid via webhook.">
        <Toggle testid="toggle-cashfree" label="Enable Cashfree" value={s.enable_cashfree} onChange={(v)=>set("enable_cashfree", v)}/>
        <div className="grid sm:grid-cols-2 gap-3">
          <TF label="App ID" testid="cashfree-app-id" value={s.cashfree_app_id} onChange={(v)=>set("cashfree_app_id",v)}/>
          <TF label="Secret Key" testid="cashfree-secret" type="password" value={s.cashfree_secret_key} onChange={(v)=>set("cashfree_secret_key",v)}/>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Mode</label>
          <select data-testid="cashfree-mode" value={s.cashfree_mode} onChange={(e)=>set("cashfree_mode", e.target.value)} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#FF8A00] outline-none">
            <option value="sandbox">Sandbox (test)</option>
            <option value="production">Production (live)</option>
          </select>
        </div>
      </Card>

      {/* Razorpay */}
      <Card icon={ShieldCheck} title="Razorpay (coming soon)" desc="Save your Razorpay keys here. We&apos;ll wire up the checkout flow once enabled.">
        <Toggle testid="toggle-razorpay" label="Enable Razorpay" value={s.enable_razorpay} onChange={(v)=>set("enable_razorpay", v)}/>
        <div className="grid sm:grid-cols-2 gap-3">
          <TF label="Key ID" testid="razorpay-key-id" value={s.razorpay_key_id} onChange={(v)=>set("razorpay_key_id",v)}/>
          <TF label="Key Secret" testid="razorpay-secret" type="password" value={s.razorpay_key_secret} onChange={(v)=>set("razorpay_key_secret",v)}/>
        </div>
        <div className="mt-2 text-xs text-amber-600">Razorpay integration wiring will activate once you share the keys + we&apos;ll enable the checkout endpoint.</div>
      </Card>

      <button onClick={save} disabled={busy} data-testid="payment-settings-save-bottom" className="kh-cta w-full py-3 inline-flex items-center justify-center gap-1.5"><Save className="w-4 h-4"/>{busy?"Saving…":"Save all settings"}</button>
    </div>
  );
}

const Card = ({icon: Icon, title, desc, children}) => (
  <div className="rounded-2xl bg-white kh-shadow-card p-6">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#FF8A00] flex items-center justify-center"><Icon className="w-5 h-5"/></div>
      <div>
        <div className="font-semibold text-[#0F2D5C]" style={{fontFamily:"Outfit"}}>{title}</div>
        <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
      </div>
    </div>
    <div className="mt-4 space-y-3">{children}</div>
  </div>
);
const TF = ({label, testid, value, onChange, type="text", placeholder=""}) => (
  <div>
    <label className="text-sm font-medium text-slate-700">{label}</label>
    <input data-testid={testid} type={type} placeholder={placeholder} value={value || ""} onChange={(e)=>onChange(e.target.value)} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/20 outline-none"/>
  </div>
);
const Toggle = ({label, value, onChange, testid}) => (
  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 cursor-pointer">
    <span className="text-sm font-medium text-[#0F2D5C]">{label}</span>
    <button type="button" data-testid={testid} onClick={()=>onChange(!value)} className={`relative w-11 h-6 rounded-full transition ${value?"bg-emerald-500":"bg-slate-300"}`}>
      <span className={`absolute top-0.5 ${value?"left-6":"left-0.5"} w-5 h-5 bg-white rounded-full transition shadow-sm`}/>
    </button>
  </label>
);
