import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { LifeBuoy, Plus, MessageSquare, X, Send } from "lucide-react";
import api, { formatError } from "@/lib/api";

const STATUS_COLOR = {
  open: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-emerald-100 text-emerald-700",
  closed: "bg-slate-200 text-slate-600",
};
const PRIO_COLOR = {
  low: "bg-slate-100 text-slate-600",
  normal: "bg-blue-50 text-blue-700",
  high: "bg-red-100 text-red-700",
};

export default function Support() {
  const [items, setItems] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ subject: "", message: "", priority: "normal", category: "general" });
  const [open, setOpen] = useState(null);
  const [reply, setReply] = useState("");

  const load = () => api.get("/support/tickets/mine").then((r)=>setItems(r.data));
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/support/tickets", form);
      toast.success("Ticket raised. Our team will respond soon.");
      setShowNew(false); setForm({ subject: "", message: "", priority: "normal", category: "general" });
      setOpen(data);
      load();
    } catch (e) { toast.error(formatError(e.response?.data?.detail)); }
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    try {
      const { data } = await api.post(`/support/tickets/${open.id}/reply`, { message: reply });
      setOpen(data); setReply(""); load();
    } catch (e) { toast.error(formatError(e.response?.data?.detail)); }
  };

  const viewTicket = async (id) => {
    const { data } = await api.get(`/support/tickets/${id}`);
    setOpen(data);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{fontFamily:"Outfit"}}>Help & Support</h1>
          <p className="text-slate-500 mt-1">Raise a ticket and our team will get back to you.</p>
        </div>
        <button data-testid="support-new-ticket-button" onClick={()=>setShowNew(!showNew)} className="kh-cta px-4 py-2 text-sm inline-flex items-center gap-1"><Plus className="w-4 h-4"/>New Ticket</button>
      </div>

      {showNew && (
        <form onSubmit={create} className="rounded-2xl bg-white kh-shadow-card p-5 space-y-3">
          <input data-testid="ticket-subject-input" required placeholder="Subject" value={form.subject} onChange={(e)=>setForm({...form, subject: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-[#FF8A00]"/>
          <textarea data-testid="ticket-message-input" required rows={4} placeholder="Describe your issue…" value={form.message} onChange={(e)=>setForm({...form, message: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-[#FF8A00] resize-none"/>
          <div className="grid grid-cols-2 gap-3">
            <select data-testid="ticket-category-select" value={form.category} onChange={(e)=>setForm({...form, category: e.target.value})} className="px-4 py-2.5 rounded-xl border border-slate-200">
              <option value="general">General</option>
              <option value="booking">Booking issue</option>
              <option value="payment">Payment</option>
              <option value="account">Account</option>
              <option value="partner">Partner-related</option>
            </select>
            <select data-testid="ticket-priority-select" value={form.priority} onChange={(e)=>setForm({...form, priority: e.target.value})} className="px-4 py-2.5 rounded-xl border border-slate-200">
              <option value="low">Low priority</option>
              <option value="normal">Normal</option>
              <option value="high">High priority</option>
            </select>
          </div>
          <button data-testid="ticket-submit-button" className="kh-cta w-full py-3">Submit ticket</button>
        </form>
      )}

      {open && (
        <TicketThread ticket={open} onClose={()=>setOpen(null)} reply={reply} setReply={setReply} sendReply={sendReply}/>
      )}

      {!open && (
        <div>
          {items.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-2xl">
              <LifeBuoy className="w-10 h-10 mx-auto text-slate-300"/>
              <div className="mt-3 text-slate-500">No tickets yet.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((t)=>(
                <button key={t.id} data-testid={`ticket-row-${t.id}`} onClick={()=>viewTicket(t.id)} className="w-full text-left flex items-center justify-between bg-white rounded-2xl p-4 kh-shadow-card hover:kh-shadow-hover transition">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-[#FF8A00] mt-1"/>
                    <div>
                      <div className="font-semibold text-[#0F2D5C]">{t.subject}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{t.category} • {t.messages?.length || 1} message{t.messages?.length !== 1 ? "s" : ""} • {new Date(t.updated_at).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`kh-chip ${STATUS_COLOR[t.status]}`}>{t.status.replace("_"," ")}</span>
                    <span className={`kh-chip text-[10px] ${PRIO_COLOR[t.priority]}`}>{t.priority}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TicketThread({ ticket, onClose, reply, setReply, sendReply, adminActions }) {
  return (
    <div className="rounded-2xl bg-white kh-shadow-card overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`kh-chip ${STATUS_COLOR[ticket.status]}`}>{ticket.status.replace("_"," ")}</span>
            <span className={`kh-chip text-[10px] ${PRIO_COLOR[ticket.priority]}`}>{ticket.priority}</span>
            <span className="kh-chip bg-slate-100 text-slate-600 text-[10px]">{ticket.category}</span>
          </div>
          <div className="text-lg font-bold text-[#0F2D5C]" style={{fontFamily:"Outfit"}}>{ticket.subject}</div>
        </div>
        <button data-testid="ticket-close-button" onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5"/></button>
      </div>
      {adminActions}
      <div className="p-5 space-y-3 max-h-[440px] overflow-y-auto bg-slate-50">
        {(ticket.messages || []).map((m) => (
          <div key={m.id} className={`flex ${m.author_role === "admin" ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${m.author_role === "admin" ? "bg-white border border-slate-200" : "bg-[#FF8A00] text-white"}`}>
              <div className="text-xs opacity-80 mb-0.5">{m.author_name} • {new Date(m.at).toLocaleString()}</div>
              <div className="text-sm whitespace-pre-wrap">{m.message}</div>
            </div>
          </div>
        ))}
      </div>
      {ticket.status !== "closed" && (
        <div className="p-4 border-t border-slate-100 flex gap-2">
          <input data-testid="ticket-reply-input" value={reply} onChange={(e)=>setReply(e.target.value)} onKeyDown={(e)=>e.key==="Enter" && sendReply()} placeholder="Type your reply…" className="flex-1 px-4 py-2.5 rounded-full border border-slate-200 outline-none focus:border-[#FF8A00]"/>
          <button data-testid="ticket-send-reply-button" onClick={sendReply} disabled={!reply.trim()} className="kh-cta px-5 py-2.5 disabled:opacity-50 inline-flex items-center gap-1"><Send className="w-4 h-4"/>Send</button>
        </div>
      )}
    </div>
  );
}
