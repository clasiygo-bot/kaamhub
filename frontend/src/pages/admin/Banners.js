import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Image as ImageIcon, X, Upload } from "lucide-react";
import api, { formatError } from "@/lib/api";
import { readFileAsDataURL } from "@/lib/file";

const EMPTY = { title: "", subtitle: "", image: "", link: "", placement: "customer_home", active: true, order: 0 };

export default function Banners() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const load = () => api.get("/admin/banners").then((r)=>setItems(r.data));
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setEditing("new"); };
  const openEdit = (b) => { setForm({ ...b }); setEditing(b.id); };
  const close = () => { setEditing(null); setForm(EMPTY); };

  const save = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, order: Number(form.order) || 0 };
      if (editing === "new") await api.post("/admin/banners", payload);
      else await api.put(`/admin/banners/${editing}`, payload);
      toast.success(editing === "new" ? "Banner created" : "Banner updated");
      close(); load();
    } catch (e) { toast.error(formatError(e.response?.data?.detail)); }
  };
  const del = async (id) => { if (!confirm("Delete this banner?")) return; await api.delete(`/admin/banners/${id}`); toast.success("Deleted"); load(); };
  const toggle = async (b) => { await api.put(`/admin/banners/${b.id}`, { ...b, active: !b.active }); load(); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{fontFamily:"Outfit"}}>App Banners</h1>
          <p className="text-slate-500 mt-1">Slides & offer banners for Customer + Partner app home.</p>
        </div>
        <button data-testid="banner-add-button" onClick={openNew} className="kh-cta px-4 py-2 text-sm inline-flex items-center gap-1"><Plus className="w-4 h-4"/>New Banner</button>
      </div>

      {editing && (
        <form onSubmit={save} className="rounded-2xl bg-white kh-shadow-card p-5 space-y-3 relative">
          <button type="button" onClick={close} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"><X className="w-4 h-4"/></button>
          <h2 className="text-lg font-bold text-[#0F2D5C]">{editing === "new" ? "Create banner" : "Edit banner"}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <TF
  label="Title"
  testid="banner-title"
  value={form.title}
  onChange={(v)=>setForm({...form,title:v})}
/>
            <TF label="Subtitle" testid="banner-subtitle" value={form.subtitle} onChange={(v)=>setForm({...form,subtitle:v})}/>
            <TF label="Image URL (or upload below)" testid="banner-image" value={form.image} onChange={(v)=>setForm({...form,image:v})} placeholder="https://…  or leave empty and upload"/>
            <div>
              <label className="text-sm font-medium text-slate-700">Or upload from device</label>
              <label className="mt-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#FF8A00] cursor-pointer transition">
                <Upload className="w-4 h-4 text-slate-500"/>
                <span className="text-sm text-slate-600">Choose image (jpg/png/webp)</span>
                <input
                  data-testid="banner-image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const dataUrl = await readFileAsDataURL(file, { maxWidth: 1600, quality: 0.85 });
                      setForm((f) => ({ ...f, image: dataUrl }));
                      toast.success("Image loaded — click Save to publish");
                    } catch (err) { toast.error(err.message || "Could not read file"); }
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            <TF label="Link (optional)" testid="banner-link" value={form.link} onChange={(v)=>setForm({...form,link:v})} placeholder="/customer or https://…"/>
            <div>
              <label className="text-sm font-medium text-slate-700">Placement</label>
              <select data-testid="banner-placement" value={form.placement} onChange={(e)=>setForm({...form, placement: e.target.value})} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200">
                <option value="customer_home">Customer app</option>
                <option value="partner_home">Partner app</option>
                <option value="both">Both</option>
              </select>
            </div>
            <TF label="Order" testid="banner-order" type="number" value={form.order} onChange={(v)=>setForm({...form,order:v})}/>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input data-testid="banner-active" type="checkbox" checked={form.active} onChange={(e)=>setForm({...form, active: e.target.checked})}/>
            Active
          </label>
          {form.image && <img src={form.image} alt="" className="w-full max-w-md h-40 object-cover rounded-xl border border-slate-200"/>}
          <button data-testid="banner-save" className="kh-cta w-full py-3">{editing === "new" ? "Create" : "Save changes"}</button>
        </form>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((b)=>(
          <div key={b.id} data-testid={`banner-card-${b.id}`} className="rounded-2xl bg-white kh-shadow-card overflow-hidden">
            {b.image ? <img src={b.image} alt="" className="w-full h-32 object-cover"/> : <div className="w-full h-32 bg-slate-100 flex items-center justify-center"><ImageIcon className="w-6 h-6 text-slate-400"/></div>}
            <div className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="kh-chip bg-slate-100 text-slate-600 text-[10px]">{b.placement.replace("_"," ")}</span>
                <span className={`kh-chip ${b.active?"bg-emerald-100 text-emerald-700":"bg-slate-200 text-slate-600"}`}>{b.active?"Active":"Inactive"}</span>
              </div>
              <div className="font-semibold text-[#0F2D5C]">{b.title}</div>
              <div className="text-xs text-slate-500 line-clamp-1">{b.subtitle}</div>
              <div className="mt-3 flex gap-2">
                <button data-testid={`banner-edit-${b.id}`} onClick={()=>openEdit(b)} className="text-xs px-3 py-1 rounded-full border border-slate-200 inline-flex items-center gap-1"><Edit2 className="w-3 h-3"/>Edit</button>
                <button data-testid={`banner-toggle-${b.id}`} onClick={()=>toggle(b)} className="text-xs px-3 py-1 rounded-full border border-slate-200">{b.active?"Disable":"Enable"}</button>
                <button data-testid={`banner-delete-${b.id}`} onClick={()=>del(b.id)} className="p-1.5 rounded-full text-red-500 hover:bg-red-50 ml-auto"><Trash2 className="w-4 h-4"/></button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="col-span-full text-center py-12 bg-slate-50 rounded-2xl text-slate-500">No banners yet.</div>}
      </div>
    </div>
  );
}

const TF = ({label, testid, value, onChange, type="text", required, placeholder=""}) => (
  <div>
    <label className="text-sm font-medium text-slate-700">{label}{required && <span className="text-red-500">*</span>}</label>
    <input data-testid={testid} type={type} required={required} placeholder={placeholder} value={value ?? ""} onChange={(e)=>onChange(e.target.value)} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/20 outline-none"/>
  </div>
);
