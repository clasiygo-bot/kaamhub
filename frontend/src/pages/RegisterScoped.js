import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Mail, Lock, User, Phone, ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { formatError } from "@/lib/api";

// Role-locked register. `role` prop is required ("customer" | "partner").
export default function RegisterScoped({ role, heroTitle, heroSubtitle, ctaLabel }) {
  const { register } = useAuth();
  const nav = useNavigate();
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

  const loginPath = role === "partner" ? "/partner/login" : "/user/login";

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 sm:p-12 bg-white order-2 lg:order-1">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-6"><Logo /></div>
          <span className="kh-chip bg-orange-100 text-[#FF8A00] mb-3 inline-block capitalize" data-testid="register-role-badge">{role} sign up</span>
          <h1 className="text-3xl font-bold" style={{fontFamily:"Outfit"}}>{ctaLabel || "Create your account"}</h1>
          <p className="text-slate-500 mt-1">
            {role === "customer" ? "Book verified home service pros in minutes." : "Join KaamHub and earn on your own schedule."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              <input data-testid="register-name-input" placeholder="Full name" required value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/20 outline-none"/>
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              <input data-testid="register-email-input" type="email" placeholder="Email" required value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/20 outline-none"/>
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              <input data-testid="register-phone-input" type="tel" placeholder={role === "partner" ? "Phone (required for job alerts)" : "Phone (optional)"} required={role === "partner"} value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/20 outline-none"/>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              <input data-testid="register-password-input" type="password" placeholder="Password (min 6 chars)" required minLength={6} value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/20 outline-none"/>
            </div>
            <button data-testid="register-submit-button" disabled={busy} className="kh-cta w-full py-3 inline-flex items-center justify-center gap-2 disabled:opacity-60">
              {busy ? "Creating…" : (<>Create account <ArrowRight className="w-4 h-4"/></>)}
            </button>
          </form>
          <p className="mt-6 text-sm text-slate-500 text-center">
            Already have an account? <Link data-testid="register-login-link" to={loginPath} className="text-[#0F2D5C] font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
      <div className="hidden lg:flex relative items-center justify-center bg-[#0F2D5C] p-12 overflow-hidden order-1 lg:order-2">
        <div className="absolute inset-0 kh-grain opacity-50" />
        <div className="relative z-10 text-white max-w-md">
          <Logo white />
          <h2 className="mt-12 text-4xl font-bold leading-tight" style={{fontFamily:"Outfit"}}>
            {heroTitle || <>Join <span className="text-[#FF8A00]">KaamHub</span> today</>}
          </h2>
          <p className="mt-4 text-white/70 text-lg">{heroSubtitle || "Har Kaam, Ab Hoga Aasaan!"}</p>
        </div>
      </div>
    </div>
  );
}
