import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import api, { formatError } from "@/lib/api";
import { TicketThread } from "@/pages/Support";

const STATUS_COLOR = {
  open: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-emerald-100 text-emerald-700",
  closed: "bg-slate-200 text-slate-600",
};

export default function AdminTickets() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("open");
  const [open, setOpen] = useState(null);
  const [reply, setReply] = useState("");

  const load = () => api.get("/admin/tickets", { params: { status_filter: filter } }).then((r)=>setItems(r.data));
  useEffect(() => { load(); }, [filter]);

  const viewTicket = async (id) => {
    const { data } = await api.get(`/support/tickets/${id}`);
    setOpen(data);
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    try {
      const { data } = await api.post(`/support/tickets/${open.id}/reply`, { message: reply });
      setOpen(data); setReply(""); load();
    } catch (e) { toast.error(formatError(e.response?.data?.detail)); }
  };

  const setStatus = async (status) => {
    try {
      await api.post(`/admin/tickets/${open.id}/status`, { status });
      toast.success("Status updated");
      setOpen({ ...open, status }); load();
    } catch (e) { toast.error(formatError(e.response?.data?.detail)); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{fontFamily:"Outfit"}}>Support Tickets</h1>
          <p className="text-slate-500 mt-1">Manage user & partner support requests.</p>
        </div>
        <div className="flex gap-2">
          {["open","in_progress","resolved","closed","all"].map((s)=>(
            <button key={s} data-testid={`tickets-filter-${s}`} onClick={()=>setFilter(s)} className={`px-4 py-1.5 rounded-full text-sm capitalize ${filter===s?"bg-[#0F2D5C] text-white":"bg-slate-100 text-slate-600"}`}>{s.replace("_"," ")}</button>
          ))}
        </div>
      </div>

      {open && (
        <TicketThread
          ticket={open}
          onClose={()=>setOpen(null)}
          reply={reply}
          setReply={setReply}
          sendReply={sendReply}
          adminActions={
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex flex-wrap gap-2 items-center">
              <div className="text-xs text-slate-500">Raised by <strong>{open.user_name || (open.messages?.[0]?.author_name)}</strong> ({open.user_role})</div>
              <div className="flex-1"/>
              {["open","in_progress","resolved","closed"].filter(s=>s!==open.status).map((s)=>(
                <button key={s} data-testid={`ticket-set-status-${s}`} onClick={()=>setStatus(s)} className="text-xs px-3 py-1 rounded-full border border-slate-200 hover:border-[#0F2D5C] inline-flex items-center gap-1">
                  {s === "resolved" && <CheckCircle2 className="w-3 h-3"/>}
                  Mark {s.replace("_"," ")}
                </button>
              ))}
            </div>
          }
        />
      )}

      {!open && (
        <div className="rounded-2xl bg-white kh-shadow-card overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left"><tr>{["Subject","User","Category","Priority","Status","Updated","Action"].map((h)=><th key={h} className="px-4 py-3 font-semibold whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {items.map((t)=>(
                <tr key={t.id} className="border-t border-slate-100" data-testid={`admin-ticket-row-${t.id}`}>
                  <td className="px-4 py-3 font-medium text-[#0F2D5C] max-w-xs truncate">{t.subject}</td>
                  <td className="px-4 py-3">{t.user?.name} <span className="text-slate-400 text-xs">({t.user_role})</span></td>
                  <td className="px-4 py-3 capitalize">{t.category}</td>
                  <td className="px-4 py-3 capitalize"><span className="kh-chip bg-slate-100 text-slate-700">{t.priority}</span></td>
                  <td className="px-4 py-3"><span className={`kh-chip ${STATUS_COLOR[t.status]}`}>{t.status.replace("_"," ")}</span></td>
                  <td className="px-4 py-3 text-xs text-slate-500">{new Date(t.updated_at).toLocaleString()}</td>
                  <td className="px-4 py-3"><button data-testid={`ticket-view-${t.id}`} onClick={()=>viewTicket(t.id)} className="text-xs px-3 py-1 rounded-full bg-[#0F2D5C] text-white">Open</button></td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan="7" className="px-4 py-10 text-center text-slate-500">No tickets.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
