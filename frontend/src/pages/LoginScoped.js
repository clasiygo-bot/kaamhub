import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Mail, Lock, ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { formatError } from "@/lib/api";

// Role-scoped login. Only accepts a specific role; rejects others.
// role: "customer" | "partner" | null (any)
export default function LoginScoped({ role = null, heroTitle, heroSubtitle, features = [] }) {
  const { login, logout } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await login(email.trim(), password);
      if (role && u.role !== role) {
        await logout();
        toast.error(`This is a ${role} login. Please use the correct app for ${u.role}s.`);
        setBusy(false);
        return;
      }
      toast.success(`Welcome back, ${u.name.split(" ")[0]}!`);
      nav(u.role === "customer" ? "/customer" : u.role === "partner" ? "/partner" : "/admin", { replace: true });
    } catch (err) {
      toast.error(formatError(err.response?.data?.detail) || err.message);
    } finally { setBusy(false); }
  };

  const registerPath = role === "partner" ? "/partner/register" : role === "customer" ? "/user/register" : "/register";
  const otherAppLink = role === "customer"
    ? { to: "/partner/login", text: "Partner? Sign in here →" }
    : role === "partner"
      ? { to: "/user/login", text: "Customer? Sign in here →" }
      : null;

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex relative items-center justify-center bg-[#0F2D5C] p-12 overflow-hidden">
        <div className="absolute inset-0 kh-grain opacity-50" />
        <div className="relative z-10 text-white max-w-md">
          <Logo white />
          <h2 className="mt-12 text-4xl font-bold leading-tight" style={{fontFamily:"Outfit"}}>
            {heroTitle || <>Welcome back to <span className="text-[#FF8A00]">KaamHub</span></>}
          </h2>
          <p className="mt-4 text-white/70 text-lg">{heroSubtitle || "Har Kaam, Ab Hoga Aasaan!"}</p>
          <div className="mt-12 space-y-4">
            {(features.length > 0 ? features : ["Verified service partners","Transparent pricing","On-time guarantee"]).map((t)=>(
              <div key={t} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#FF8A00] flex items-center justify-center text-xs">✓</div>
                <span className="text-white/90">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8"><Logo /></div>
          {role && (
            <span className="kh-chip bg-orange-100 text-[#FF8A00] mb-3 inline-block capitalize" data-testid="login-role-badge">{role} Sign in</span>
          )}
          <h1 className="text-3xl font-bold" style={{fontFamily:"Outfit"}}>Sign in</h1>
          <p className="text-slate-500 mt-1">Use your KaamHub account to continue</p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <input data-testid="login-email-input" type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com" className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/20 outline-none"/>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Password</label>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <input data-testid="login-password-input" type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/20 outline-none"/>
              </div>
            </div>
            <button data-testid="login-submit-button" disabled={busy} className="kh-cta w-full py-3 inline-flex items-center justify-center gap-2 disabled:opacity-60">
              {busy ? "Signing in…" : (<>Sign in <ArrowRight className="w-4 h-4"/></>)}
            </button>
          </form>
          <p className="mt-6 text-sm text-slate-500 text-center">
            New to KaamHub? <Link data-testid="login-register-link" to={registerPath} className="text-[#0F2D5C] font-semibold hover:underline">Create an account</Link>
          </p>
          {otherAppLink && (
            <p className="mt-2 text-xs text-center">
              <Link data-testid="login-switch-role" to={otherAppLink.to} className="text-slate-400 hover:text-[#FF8A00]">{otherAppLink.text}</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
