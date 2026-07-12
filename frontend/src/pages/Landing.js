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
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 grid lg:grid-cols-2 gap-10 items-center">
          <div className="kh-fade-up">
            <span className="kh-chip bg-orange-100 text-[#FF8A00] inline-flex items-center gap-1">
              <Star className="w-3 h-3 fill-[#FF8A00] text-[#FF8A00]" /> Trusted by 50,000+ homes
            </span>
            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight" style={{ fontFamily: "Outfit" }}>
              Home services
              <br />
              <span className="text-[#FF8A00]">at your doorstep.</span>
            </h1>
            <p className="mt-5 text-lg text-slate-600 max-w-xl">
              Book vetted professionals for plumbing, electrical, cleaning, AC repair, and more. <strong>Har Kaam, Ab Hoga Aasaan!</strong>
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link data-testid="landing-book-cta" to="/user/register" className="kh-cta px-6 py-3 inline-flex items-center gap-2">
                Book a Service <ArrowRight className="w-4 h-4" />
              </Link>
              <Link data-testid="landing-partner-cta" to="/partner/register" className="kh-outline px-6 py-3">Become a Partner</Link>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
              {[
                { icon: ShieldCheck, label: "Verified Pros" },
                { icon: Clock, label: "On-Time" },
                { icon: Star, label: "Top Rated" },
              ].map((f) => (
                <div key={f.label} className="flex flex-col items-start gap-1">
                  <f.icon className="w-5 h-5 text-[#0F2D5C]" />
                  <span className="text-sm font-medium text-slate-700">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative kh-fade-up" style={{ animationDelay: ".15s" }}>
            <div className="absolute -inset-6 bg-orange-100 rounded-[3rem] -z-10" />
            <img
              src="https://images.unsplash.com/photo-1614850715649-1d0106293bd1?w=900&q=80"
              alt="KaamHub Pro at work"
              className="rounded-[2rem] kh-shadow-card w-full object-cover aspect-[4/3]"
            />
            <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl kh-shadow-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0F2D5C] text-white flex items-center justify-center">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Active Partners</div>
                <div className="text-lg font-bold text-[#0F2D5C]">2,400+</div>
              </div>
            </div>
          </div>
        </div>
      </section>

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

     <footer className="border-t border-slate-200">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between">

    <Logo />

    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div>
        {new Date().getFullYear()} KaamHub. All Rights Reserved.
      </div>

      <Link to="/about-us" className="text-sm hover:text-orange-500">
        About Us
      </Link>

      <Link to="/privacy-policy" className="text-sm hover:text-orange-500">
        Privacy Policy
      </Link>

      <Link to="/terms-and-conditions" className="text-sm hover:text-orange-500">
        Terms & Conditions
      </Link>

      <Link to="/contact-us" className="text-sm hover:text-orange-500">
        Contact Us
      </Link>
        
      <Link to="/refund-policy" className="text-sm hover:text-orange-500">
        Refund Policy
      </Link>

        <Link to="/cancellation-policy" className="text-sm hover:text-orange-500">
          Cancellation Policy
        </Link>
    </div>

  </div>
</footer>
    </div>
  );
}
