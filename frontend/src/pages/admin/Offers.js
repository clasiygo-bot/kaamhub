import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import api, { formatError } from "@/lib/api";

export default function Offers() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", title: "", description: "", discount_pct: 10, image: "", active: true });

  const load = () => api.get("/offers").then((r)=>setItems(r.data));
  useEffect(()=>{ load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    try { await api.post("/offers", { ...form, discount_pct: Number(form.discount_pct) }); toast.success("Offer created"); setShowForm(false); setForm({code:"",title:"",description:"",discount_pct:10,image:"",active:true}); load(); }
    catch (e) { toast.error(formatError(e.response?.data?.detail)); }
  };
  const remove = async (id) => { await api.delete(`/offers/${id}`); toast.success("Deleted"); load(); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold" style={{fontFamily:"Outfit"}}>Offers & Promotions</h1>
        <button data-testid="offers-add-button" onClick={()=>setShowForm(!showForm)} className="kh-cta px-4 py-2 text-sm inline-flex items-center gap-1"><Plus className="w-4 h-4"/>New Offer</button>
      </div>
      {showForm && (
        <form onSubmit={create} className="rounded-2xl bg-white kh-shadow-card p-5 grid sm:grid-cols-2 gap-3">
          <input data-testid="offer-code-input" required placeholder="CODE (e.g. WELCOME20)" value={form.code} onChange={(e)=>setForm({...form,code:e.target.value.toUpperCase()})} className="px-4 py-3 rounded-xl border border-slate-200"/>
          <input data-testid="offer-discount-input" required type="number" min="0" max="100" placeholder="Discount %" value={form.discount_pct} onChange={(e)=>setForm({...form,discount_pct:e.target.value})} className="px-4 py-3 rounded-xl border border-slate-200"/>
          <input data-testid="offer-title-input" required placeholder="Title" value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} className="sm:col-span-2 px-4 py-3 rounded-xl border border-slate-200"/>
          <input data-testid="offer-image-input" placeholder="Image URL" value={form.image} onChange={(e)=>setForm({...form,image:e.target.value})} className="sm:col-span-2 px-4 py-3 rounded-xl border border-slate-200"/>
          <textarea data-testid="offer-description-input" placeholder="Description" rows={2} value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} className="sm:col-span-2 px-4 py-3 rounded-xl border border-slate-200"/>
          <button data-testid="offer-submit-button" className="kh-cta py-3 sm:col-span-2">Create offer</button>
        </form>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((o)=>(
          <div key={o.id} data-testid={`offer-card-admin-${o.code}`} className="rounded-2xl bg-white kh-shadow-card overflow-hidden">
            {o.image && <img src={o.image} alt="" className="w-full h-28 object-cover"/>}
            <div className="p-4">
              <span className="kh-chip bg-orange-100 text-[#FF8A00]">{o.code}</span>
              <h3 className="mt-2 font-semibold text-[#0F2D5C]">{o.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{o.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-sm font-bold text-[#FF8A00]">{o.discount_pct}% OFF</div>
                <button data-testid={`offer-delete-${o.id}`} onClick={()=>remove(o.id)} className="p-1.5 rounded-full text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4"/></button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="col-span-full text-center py-12 bg-slate-50 rounded-2xl text-slate-500">No offers yet.</div>}
      </div>
    </div>
  );
}
