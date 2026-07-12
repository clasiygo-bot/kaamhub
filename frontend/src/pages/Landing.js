import HeroSection from "@/components/HeroSection";
import Footer from "@/components/Footer";
import React from "react";
import { Link } from "react-router-dom";
import { Wrench, Zap, Sparkles, Wind, Hammer, ShieldCheck, Clock, Star, ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";

const services = [
  { name: "Plumber", icon: Wrench, color: "#0F2D5C" },
  { name: "Electrician", icon: Zap, color: "#FF8A00" },
  { name: "Cleaning", icon: Sparkles, color: "#10B981" },
  { name: "AC Repair", icon: Wind, color: "#0EA5E9" },
  { name: "Carpenter", icon: Hammer, color: "#8B5CF6" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <Link data-testid="landing-login-link" to="/user/login" className="kh-outline px-4 py-2 text-sm">Login</Link>
            <Link data-testid="landing-register-link" to="/user/register" className="kh-cta px-4 py-2 text-sm inline-flex items-center gap-1">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
     <HeroSection />
        

      {/* Service grid */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#FF8A00]">Services</span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-bold" style={{ fontFamily: "Outfit" }}>Pick what you need today</h2>
            </div>
            <Link data-testid="landing-all-services-link" to="/register" className="hidden sm:block text-sm font-semibold text-[#0F2D5C] hover:underline">View all →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {services.map((s) => (
              <div key={s.name} className="bg-white rounded-2xl p-5 kh-shadow-card hover:kh-shadow-hover transition cursor-pointer">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15`, color: s.color }}>
                  <s.icon className="w-6 h-6" />
                </div>
                <div className="mt-4 font-semibold text-[#0F2D5C]">{s.name}</div>
                <div className="text-xs text-slate-500 mt-1">Starts at ₹199</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="rounded-3xl bg-[#0F2D5C] text-white p-10 sm:p-14 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: "Outfit" }}>Ready to fix things the easy way?</h3>
            <p className="text-white/80 mt-2">Sign up in 30 seconds. Pay only after the job is done.</p>
          </div>
          <Link data-testid="landing-bottom-cta" to="/user/register" className="kh-cta px-7 py-3.5 text-base whitespace-nowrap">Get the App</Link>
        </div>
      </section>
        
    <Footer/>
        
    </div>
  );
}
