import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle2, Eye, X, Send } from "lucide-react";
import api, { formatError } from "@/lib/api";

const statusColor = {
  pending: "bg-slate-100 text-slate-600",
  accepted: "bg-blue-100 text-blue-700",
  on_the_way: "bg-amber-100 text-amber-700",
  started: "bg-orange-100 text-orange-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminBookings() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("");
  const [paying, setPaying] = useState(null);
  const [payForm, setPayForm] = useState({ payment_method: "cash", payment_ref: "" });

  const load = () => api.get("/admin/bookings", { params: { status_filter: status || undefined } }).then((r)=>setItems(r.data));
  useEffect(() => { load(); }, [status]);

  const markPaid = async (id) => {
    try {
      await api.post(`/admin/bookings/${id}/payment`, { action: "mark_paid", ...payForm });
      toast.success("Payment confirmed");
      setPaying(null);
      setPayForm({ payment_method: "cash", payment_ref: "" });
      load();
    } catch (e) { toast.error(formatError(e.response?.data?.detail)); }
  };

  const markUnpaid = async (id) => {
    try { await api.post(`/admin/bookings/${id}/payment`, { action: "mark_unpaid" }); toast.success("Marked unpaid"); load(); }
    catch (e) { toast.error(formatError(e.response?.data?.detail)); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold" style={{fontFamily:"Outfit"}}>All Bookings</h1>
        <select data-testid="admin-bookings-filter" value={status} onChange={(e)=>setStatus(e.target.value)} className="px-4 py-2 rounded-full border border-slate-200 text-sm">
          <option value="">All statuses</option>
          {["pending","accepted","on_the_way","started","completed","cancelled"].map(s=><option key={s} value={s}>{s.replace("_"," ")}</option>)}
        </select>
      </div>
      <div className="rounded-2xl bg-white kh-shadow-card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>{["Service","Customer","Partner","Date","Amount","Status","Payment","Actions"].map((h)=><th key={h} className="px-4 py-3 font-semibold whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody>
            {items.map((b)=>(
              <React.Fragment key={b.id}>
                <tr data-testid={`admin-booking-row-${b.id}`} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-[#0F2D5C]">{b.service?.name}</td>
                  <td className="px-4 py-3">
                    {b.customer ? <Link to={`/admin/users/${b.customer_id}`} className="hover:text-[#FF8A00]">{b.customer.name}</Link> : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {b.partner ? <Link to={`/admin/users/${b.partner_id}`} className="hover:text-[#FF8A00]">{b.partner.name}</Link> : <span className="text-slate-400">Unassigned</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{b.date} {b.time}</td>
                  <td className="px-4 py-3 font-semibold whitespace-nowrap">₹{b.amount}</td>
                  <td className="px-4 py-3"><span className={`kh-chip ${statusColor[b.status]}`}>{b.status.replace("_"," ")}</span></td>
                  <td className="px-4 py-3">
                    <span className={`kh-chip ${b.payment_status==="paid"?"bg-emerald-100 text-emerald-700":"bg-amber-100 text-amber-700"}`}>{b.payment_status || "unpaid"}</span>
                    {b.payment_ref && <div className="text-[10px] text-slate-400 mt-1">Ref: {b.payment_ref}</div>}
                  </td>
                  <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                    {b.payment_status !== "paid" && b.status !== "cancelled" && (
                      <button onClick={()=>setPaying(paying === b.id ? null : b.id)} data-testid={`mark-paid-button-${b.id}`} className="text-xs px-3 py-1 rounded-full bg-emerald-500 text-white inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/>Mark Paid</button>
                    )}
                    {b.payment_status === "paid" && (
                      <button onClick={()=>markUnpaid(b.id)} data-testid={`mark-unpaid-button-${b.id}`} className="text-xs px-3 py-1 rounded-full border border-slate-200 inline-flex items-center gap-1"><X className="w-3 h-3"/>Undo</button>
                    )}
                    {b.partner?.phone && (
                      <a
                        data-testid={`wa-send-${b.id}`}
                        target="_blank" rel="noopener noreferrer"
                        href={`https://wa.me/${(b.partner.phone||'').replace(/[^0-9]/g,'')}?text=${encodeURIComponent(`Hi ${b.partner.name}, new KaamHub booking:\n\n${b.service?.name}\n${b.address}\n${b.date} at ${b.time}\nCustomer: ${b.customer?.name} (${b.customer?.phone || 'no phone'})\nAmount: ₹${b.amount}`)}`}
                        className="text-xs px-3 py-1 rounded-full bg-emerald-600 text-white inline-flex items-center gap-1"
                      >
                        <Send className="w-3 h-3"/>WhatsApp
                      </a>
                    )}
                  </td>
                </tr>
                {paying === b.id && (
                  <tr className="bg-emerald-50 border-t border-emerald-100">
                    <td colSpan="8" className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-medium text-emerald-800">Confirm payment of <strong>₹{b.amount}</strong> from {b.customer?.name}:</span>
                        <select data-testid={`payment-method-${b.id}`} value={payForm.payment_method} onChange={(e)=>setPayForm({...payForm, payment_method: e.target.value})} className="px-3 py-1.5 rounded-full border border-slate-200 text-sm">
                          <option value="cash">Cash</option>
                          <option value="upi">UPI</option>
                          <option value="card">Card</option>
                          <option value="netbanking">Net banking</option>
                          <option value="other">Other</option>
                        </select>
                        <input data-testid={`payment-ref-${b.id}`} value={payForm.payment_ref} onChange={(e)=>setPayForm({...payForm, payment_ref: e.target.value})} placeholder="Transaction reference (optional)" className="px-3 py-1.5 rounded-full border border-slate-200 text-sm flex-1 min-w-[200px]"/>
                        <button data-testid={`confirm-payment-${b.id}`} onClick={()=>markPaid(b.id)} className="text-xs px-4 py-1.5 rounded-full bg-emerald-600 text-white font-semibold">Confirm payment</button>
                        <button onClick={()=>setPaying(null)} className="text-xs px-3 py-1.5 rounded-full text-slate-500">Cancel</button>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {items.length === 0 && <tr><td colSpan="8" className="px-4 py-10 text-center text-slate-500">No bookings.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
