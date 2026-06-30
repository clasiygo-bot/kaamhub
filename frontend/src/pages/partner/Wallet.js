import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Wallet as WalletIcon, ArrowDownCircle } from "lucide-react";
import api, { formatError } from "@/lib/api";

export default function Wallet() {
  const [wallet, setWallet] = useState({ balance: 0, total_earned: 0 });
  const [withdrawals, setWithdrawals] = useState([]);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => api.get("/partner/wallet").then((r) => { setWallet(r.data.wallet); setWithdrawals(r.data.withdrawals); });
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await api.post("/partner/withdraw", { amount: Number(amount) }); toast.success("Withdrawal requested"); setAmount(""); load(); }
    catch (e) { toast.error(formatError(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold" style={{fontFamily:"Outfit"}}>Wallet</h1>
      <div className="rounded-3xl bg-gradient-to-br from-[#0F2D5C] to-[#1a3a73] text-white p-8 kh-shadow-card">
        <WalletIcon className="w-7 h-7 text-[#FF8A00]"/>
        <div className="mt-4 text-sm text-white/70">Available balance</div>
        <div className="text-4xl font-bold mt-1">₹{wallet.balance || 0}</div>
        <div className="mt-3 text-xs text-white/60">Total earned: ₹{wallet.total_earned || 0}</div>
      </div>

      <form onSubmit={submit} className="rounded-3xl bg-white kh-shadow-card p-6">
        <div className="flex items-center gap-2 mb-3"><ArrowDownCircle className="w-5 h-5 text-[#FF8A00]"/><h2 className="text-lg font-bold" style={{fontFamily:"Outfit"}}>Request withdrawal</h2></div>
        <div className="flex gap-3">
          <input data-testid="withdraw-amount-input" type="number" min="1" max={wallet.balance} value={amount} onChange={(e)=>setAmount(e.target.value)} placeholder="Amount in ₹" className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-[#FF8A00] outline-none"/>
          <button disabled={busy || !amount} data-testid="withdraw-submit-button" className="kh-cta px-5 disabled:opacity-50">{busy?"…":"Request"}</button>
        </div>
        <div className="text-xs text-slate-500 mt-2">Payouts processed every Monday by admin.</div>
      </form>

      <div className="rounded-3xl bg-white kh-shadow-card p-6">
        <h3 className="text-lg font-bold mb-4" style={{fontFamily:"Outfit"}}>Withdrawal history</h3>
        {withdrawals.length === 0 ? (
          <div className="text-sm text-slate-500">No withdrawals yet</div>
        ) : (
          <div className="space-y-2">
            {withdrawals.map((w)=>(
              <div key={w.id} data-testid={`withdrawal-row-${w.id}`} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <div>
                  <div className="font-semibold text-[#0F2D5C]">₹{w.amount}</div>
                  <div className="text-xs text-slate-500">{new Date(w.created_at).toLocaleString()}{w.utr && ` • UTR ${w.utr}`}</div>
                </div>
                <span className={`kh-chip ${w.status==="paid"?"bg-emerald-100 text-emerald-700":w.status==="rejected"?"bg-red-100 text-red-700":w.status==="approved"?"bg-blue-100 text-blue-700":"bg-amber-100 text-amber-700"}`}>{w.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
