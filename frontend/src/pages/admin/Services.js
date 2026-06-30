import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import api, { formatError } from "@/lib/api";

export default function Services() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", category: "Plumber", description: "", price: 199, duration_min: 60, image: "", active: true });

  const load = () => api.get("/services", { params: { active_only: false } }).then((r)=>setItems(r.data));
  useEffect(()=>{ load(); api.get("/categories").then((r)=>setCategories(r.data)); }, []);

  const create = async (e) => {
    e.preventDefault();
    try { await api.post("/services", { ...form, price: Number(form.price), duration_min: Number(form.duration_min) }); toast.success("Service created"); setShowForm(false); setForm({name:"",category:"Plumber",description:"",price:199,duration_min:60,image:"",active:true}); load(); }
    catch (e) { toast.error(formatError(e.response?.data?.detail)); }
  };
  const remove = async (id) => { if (!confirm("Delete this service?")) return; await api.delete(`/services/${id}`); toast.success("Deleted"); load(); };
  const toggle = async (s) => { await api.put(`/services/${s.id}`, { ...s, active: !s.active }); load(); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold" style={{fontFamily:"Outfit"}}>Service Catalogue</h1>
        <button data-testid="services-add-button" onClick={()=>setShowForm(!showForm)} className="kh-cta px-4 py-2 text-sm inline-flex items-center gap-1"><Plus className="w-4 h-4"/>Add Service</button>
      </div>

      {showForm && (
        <form onSubmit={create} className="rounded-2xl bg-white kh-shadow-card p-5 grid sm:grid-cols-2 gap-3">
          <input data-testid="service-name-input" required placeholder="Service name" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} className="px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-[#FF8A00]"/>
          <select data-testid="service-category-select" value={form.category} onChange={(e)=>setForm({...form,category:e.target.value})} className="px-4 py-3 rounded-xl border border-slate-200">
            {categories.map((c)=><option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <input data-testid="service-price-input" required type="number" placeholder="Price ₹" value={form.price} onChange={(e)=>setForm({...form,price:e.target.value})} className="px-4 py-3 rounded-xl border border-slate-200"/>
          <input data-testid="service-duration-input" required type="number" placeholder="Duration (min)" value={form.duration_min} onChange={(e)=>setForm({...form,duration_min:e.target.value})} className="px-4 py-3 rounded-xl border border-slate-200"/>
          <input data-testid="service-image-input" placeholder="Image URL" value={form.image} onChange={(e)=>setForm({...form,image:e.target.value})} className="sm:col-span-2 px-4 py-3 rounded-xl border border-slate-200"/>
          <textarea data-testid="service-description-input" placeholder="Description" value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} rows={2} className="sm:col-span-2 px-4 py-3 rounded-xl border border-slate-200"/>
          <button data-testid="service-create-submit" className="kh-cta py-3 sm:col-span-2">Create</button>
        </form>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((s)=>(
          <div key={s.id} data-testid={`admin-service-${s.id}`} className="rounded-2xl bg-white kh-shadow-card overflow-hidden">
            {s.image && <img src={s.image} alt="" className="w-full h-32 object-cover"/>}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <span className="kh-chip bg-slate-100 text-slate-600">{s.category}</span>
                <span className={`kh-chip ${s.active?"bg-emerald-100 text-emerald-700":"bg-slate-200 text-slate-600"}`}>{s.active?"Active":"Inactive"}</span>
              </div>
              <h3 className="mt-2 font-semibold text-[#0F2D5C]">{s.name}</h3>
              <p className="text-xs text-slate-500 line-clamp-2 mt-1">{s.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-lg font-bold text-[#FF8A00]">₹{s.price}</div>
                <div className="flex gap-2">
                  <button data-testid={`service-toggle-${s.id}`} onClick={()=>toggle(s)} className="text-xs px-3 py-1 rounded-full border border-slate-200">{s.active?"Disable":"Enable"}</button>
                  <button data-testid={`service-delete-${s.id}`} onClick={()=>remove(s.id)} className="p-1.5 rounded-full text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
