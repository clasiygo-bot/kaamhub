import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Mail, Lock, User, Phone, ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { formatError } from "@/lib/api";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [role, setRole] = useState("customer");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await register({ ...form, email: form.email.trim(), role });
      toast.success("Welcome to KaamHub!");
      nav(u.role === "customer" ? "/customer" : "/partner", { replace: true });
    } catch (err) {
      toast.error(formatError(err.response?.data?.detail) || err.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 sm:p-12 bg-white order-2 lg:order-1">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-6"><Logo /></div>
          <h1 className="text-3xl font-bold" style={{fontFamily:"Outfit"}}>Create your account</h1>
          <p className="text-slate-500 mt-1">Choose how you&apos;d like to use KaamHub</p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              { v: "customer", title: "I need services", sub: "Book home services" },
              { v: "partner", title: "I provide services", sub: "Earn with KaamHub" },
            ].map((r) => (
              <button
                key={r.v}
                type="button"
                onClick={() => setRole(r.v)}
                data-testid={`register-role-${r.v}`}
                className={`p-4 text-left rounded-2xl border-2 transition ${
                  role === r.v ? "border-[#FF8A00] bg-orange-50" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="text-sm font-semibold text-[#0F2D5C]">{r.title}</div>
                <div className="text-xs text-slate-500 mt-1">{r.sub}</div>
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              <input data-testid="register-name-input" placeholder="Full name" required value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/20 outline-none"/>
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              <input data-testid="register-email-input" type="email" placeholder="Email" required value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/20 outline-none"/>
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              <input data-testid="register-phone-input" type="tel" placeholder="Phone (optional)" value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/20 outline-none"/>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              <input data-testid="register-password-input" type="password" placeholder="Password (min 6 chars)" required minLength={6} value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/20 outline-none"/>
            </div>
            <button data-testid="register-submit-button" disabled={busy} className="kh-cta w-full py-3 inline-flex items-center justify-center gap-2 disabled:opacity-60">
              {busy ? "Creating…" : (<>Create account <ArrowRight className="w-4 h-4"/></>)}
            </button>
          </form>
          <p className="mt-6 text-sm text-slate-500 text-center">
            Already have an account? <Link data-testid="register-login-link" to="/login" className="text-[#0F2D5C] font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
      <div className="hidden lg:flex relative items-center justify-center bg-[#0F2D5C] p-12 overflow-hidden order-1 lg:order-2">
        <div className="absolute inset-0 kh-grain opacity-50" />
        <div className="relative z-10 text-white max-w-md">
          <Logo white />
          <h2 className="mt-12 text-4xl font-bold leading-tight" style={{fontFamily:"Outfit"}}>
            Join <span className="text-[#FF8A00]">KaamHub</span> today
          </h2>
          <p className="mt-4 text-white/70 text-lg">Book home services or earn as a verified partner.</p>
        </div>
      </div>
    </div>
  );
}
