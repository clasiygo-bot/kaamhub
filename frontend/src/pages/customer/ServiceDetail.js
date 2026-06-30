import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Clock, Star } from "lucide-react";
import api from "@/lib/api";

export default function ServiceDetail() {
  const { id } = useParams();
  const [s, setS] = useState(null);

  useEffect(() => { api.get(`/services/${id}`).then((r)=>setS(r.data)); }, [id]);

  if (!s) return <div className="py-20 text-center text-slate-400">Loading…</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/customer" data-testid="service-back-link" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-[#0F2D5C] mb-4">
        <ArrowLeft className="w-4 h-4"/> Back
      </Link>
      <div className="rounded-3xl overflow-hidden kh-shadow-card bg-white">
        <img src={s.image} alt={s.name} className="w-full aspect-[16/9] object-cover" />
        <div className="p-6 sm:p-8">
          <span className="kh-chip bg-slate-100 text-slate-600 text-xs">{s.category}</span>
          <h1 className="mt-3 text-3xl font-bold" style={{fontFamily:"Outfit"}}>{s.name}</h1>
          <div className="mt-2 flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1"><Clock className="w-4 h-4"/>{s.duration_min} min</span>
            <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-[#FF8A00] text-[#FF8A00]"/>4.8 (2.3k reviews)</span>
            <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-emerald-500"/>Verified Pros</span>
          </div>
          <p className="mt-6 text-slate-600 leading-relaxed">{s.description}</p>

          <div className="mt-8 p-5 rounded-2xl bg-slate-50 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">Total</div>
              <div className="text-3xl font-bold text-[#0F2D5C]">₹{s.price}</div>
              <div className="text-xs text-slate-400 mt-1">Inclusive of taxes</div>
            </div>
            <Link to={`/customer/book/${s.id}`} data-testid="service-book-now-button" className="kh-cta px-6 py-3">Book Now</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
