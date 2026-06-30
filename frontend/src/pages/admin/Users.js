import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import api, { formatError } from "@/lib/api";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState("customer");
  const load = () => api.get("/admin/users", { params: { role: role || undefined } }).then((r)=>setUsers(r.data));
  useEffect(() => { load(); }, [role]);

  const toggle = async (id) => { try { await api.post(`/admin/users/${id}/toggle`); load(); toast.success("Updated"); } catch (e) { toast.error(formatError(e.response?.data?.detail)); } };
  const del = async (id) => { if (!confirm("Delete this user?")) return; await api.delete(`/admin/users/${id}`); toast.success("Deleted"); load(); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold" style={{fontFamily:"Outfit"}}>Users</h1>
        <div className="flex gap-2">
          {["customer","partner","admin"].map((r)=>(
            <button key={r} data-testid={`users-filter-${r}`} onClick={()=>setRole(r)} className={`px-4 py-1.5 rounded-full text-sm capitalize ${role===r?"bg-[#0F2D5C] text-white":"bg-slate-100 text-slate-600"}`}>{r}</button>
          ))}
        </div>
      </div>
      <div className="rounded-2xl bg-white kh-shadow-card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left"><tr>{["Name","Email","Phone","Active","Joined","Actions"].map((h)=><th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {users.map((u)=>(
              <tr key={u.id} className="border-t border-slate-100" data-testid={`user-row-${u.id}`}>
                <td className="px-4 py-3 font-medium text-[#0F2D5C]">{u.name}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">{u.phone || "—"}</td>
                <td className="px-4 py-3"><span className={`kh-chip ${u.active?"bg-emerald-100 text-emerald-700":"bg-red-100 text-red-700"}`}>{u.active?"Active":"Disabled"}</span></td>
                <td className="px-4 py-3 text-xs text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 space-x-2">
                  {u.role !== "admin" && <>
                    <button data-testid={`user-toggle-${u.id}`} onClick={()=>toggle(u.id)} className="text-xs px-3 py-1 rounded-full border border-slate-200">{u.active?"Disable":"Enable"}</button>
                    <button data-testid={`user-delete-${u.id}`} onClick={()=>del(u.id)} className="text-xs px-3 py-1 rounded-full bg-red-500 text-white">Delete</button>
                  </>}
                </td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan="6" className="px-4 py-10 text-center text-slate-500">No users.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
