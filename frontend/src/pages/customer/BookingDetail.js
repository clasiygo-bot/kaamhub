import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, MapPin, Phone, MessageCircle, Check, Star, CreditCard, QrCode, Smartphone } from "lucide-react";
import api, { formatError } from "@/lib/api";
import { openCashfreeCheckout } from "@/lib/cashfree";
import LiveTrackingMap from "@/components/LiveTrackingMap";

const FLOW = ["pending","accepted","on_the_way","started","completed"];
const SHOW_MAP_STATUSES = new Set(["accepted","on_the_way","started"]);

export default function BookingDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [b, setB] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [paying, setPaying] = useState(false);
  const [payOpts, setPayOpts] = useState(null);
  const [showQr, setShowQr] = useState(false);

  const load = () => api.get(`/bookings/${id}`).then((r)=>setB(r.data));
  useEffect(() => {
    load();
    api.get("/payment-settings").then((r)=>setPayOpts(r.data)).catch(()=>{});
    const t = setInterval(load, 6000);
    return () => clearInterval(t);
  }, [id]);

  const cancel = async () => {
    try {
      await api.post(`/bookings/${id}/status`, { status: "cancelled" });
      toast.success("Booking cancelled"); load();
    } catch (e) { toast.error(formatError(e.response?.data?.detail)); }
  };

  const payCashfree = async () => {
    setPaying(true);
    try {
      const { data } = await api.post(`/payments/cashfree/init/${id}`);
      await openCashfreeCheckout({ paymentSessionId: data.payment_session_id, mode: data.mode || "sandbox" });
    } catch (e) {
      toast.error(formatError(e.response?.data?.detail) || e.message);
      setPaying(false);
    }
  };

  const upiIntentUrl = () => {
    if (!payOpts || !b) return "";
    const pa = encodeURIComponent(payOpts.upi_id);
    const pn = encodeURIComponent(payOpts.upi_payee_name || "KaamHub");
    const tn = encodeURIComponent(`KaamHub ${b.service?.name || "booking"} ${id.slice(0,8)}`);
    return `upi://pay?pa=${pa}&pn=${pn}&am=${b.amount}&cu=INR&tn=${tn}`;
  };

  const submitReview = async () => {
    try {
      await api.post("/reviews", { booking_id: id, rating, comment });
      toast.success("Thanks for the feedback!");
      load();
    } catch (e) { toast.error(formatError(e.response?.data?.detail)); }
  };

  if (!b) return <div className="py-20 text-center text-slate-400">Loading…</div>;

  const stepIdx = FLOW.indexOf(b.status);

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={()=>nav(-1)} data-testid="booking-detail-back" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-[#0F2D5C] mb-4"><ArrowLeft className="w-4 h-4"/> Back</button>

      <div className="rounded-3xl overflow-hidden kh-shadow-card bg-white">
        <img src={b.service?.image} alt="" className="w-full aspect-[16/7] object-cover"/>
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="kh-chip bg-slate-100 text-slate-600 text-xs">{b.service?.category}</span>
              <h1 className="mt-2 text-2xl font-bold" style={{fontFamily:"Outfit"}}>{b.service?.name}</h1>
              <div className="text-sm text-slate-500 mt-1">{b.date} • {b.time}</div>
            </div>
            <div className="text-2xl font-bold text-[#FF8A00]">₹{b.amount}</div>
          </div>

          {/* Status timeline */}
          {b.status !== "cancelled" ? (
            <div className="mt-6 grid grid-cols-5 gap-2">
              {FLOW.map((s, i) => (
                <div key={s} className="flex flex-col items-center text-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i<=stepIdx?"bg-[#FF8A00] text-white":"bg-slate-200 text-slate-500"}`}>
                    {i<stepIdx?<Check className="w-3.5 h-3.5"/>:i+1}
                  </div>
                  <div className={`mt-1 text-[10px] ${i<=stepIdx?"text-[#0F2D5C]":"text-slate-400"}`}>{s.replace("_"," ")}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 p-4 rounded-2xl bg-red-50 text-red-700 text-sm">This booking was cancelled.</div>
          )}

          {/* Address */}
          <div className="mt-6 p-4 rounded-2xl bg-slate-50 flex items-start gap-3">
            <MapPin className="w-4 h-4 text-[#FF8A00] mt-0.5"/>
            <div className="text-sm text-slate-700">{b.address}</div>
          </div>

          {/* Live tracking map */}
          {SHOW_MAP_STATUSES.has(b.status) && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-[#0F2D5C]">Partner live location</div>
                {b.partner_location?.at && <div className="text-xs text-slate-400">Updated {new Date(b.partner_location.at).toLocaleTimeString()}</div>}
              </div>
              <LiveTrackingMap
                customer={(b.lat != null && b.lng != null) ? { lat: b.lat, lng: b.lng } : null}
                partner={b.partner_location?.lat != null ? { lat: b.partner_location.lat, lng: b.partner_location.lng } : null}
              />
            </div>
          )}

          {/* Payment status */}
          <div className={`mt-3 p-4 rounded-2xl flex items-center justify-between gap-3 ${b.payment_status === "paid" ? "bg-emerald-50" : "bg-amber-50"}`}>
            <div>
              <div className="text-xs text-slate-500">Payment</div>
              <div className={`font-semibold ${b.payment_status === "paid" ? "text-emerald-700" : "text-amber-700"}`}>
                {b.payment_status === "paid" ? "✓ Payment received" : b.payment_status === "initiated" ? "Awaiting payment confirmation" : "Pending"}
              </div>
              {b.payment_ref && <div className="text-xs text-slate-500 mt-0.5">Ref: {b.payment_ref} • {b.payment_method}</div>}
            </div>
            <div className="text-2xl font-bold text-[#0F2D5C]">₹{b.amount}</div>
          </div>

          {/* Payment options */}
          {b.payment_status !== "paid" && b.status !== "cancelled" && payOpts && (
            <div className="mt-3 p-5 rounded-2xl bg-slate-50">
              <div className="text-sm font-semibold text-[#0F2D5C] mb-3">Choose how to pay</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {payOpts.enable_qr && (
                  <button onClick={()=>setShowQr(!showQr)} data-testid="pay-option-qr" className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 hover:border-[#FF8A00] transition">
                    <QrCode className="w-5 h-5 text-[#FF8A00]"/>
                    <div className="text-left flex-1">
                      <div className="text-sm font-semibold text-[#0F2D5C]">Scan QR Code</div>
                      <div className="text-[11px] text-slate-500">Pay via any UPI app</div>
                    </div>
                  </button>
                )}
                {payOpts.enable_upi_intent && (
                  <a href={upiIntentUrl()} data-testid="pay-option-upi-intent" className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 hover:border-[#FF8A00] transition">
                    <Smartphone className="w-5 h-5 text-[#FF8A00]"/>
                    <div className="text-left flex-1">
                      <div className="text-sm font-semibold text-[#0F2D5C]">UPI App</div>
                      <div className="text-[11px] text-slate-500">Open GPay/PhonePe/Paytm</div>
                    </div>
                  </a>
                )}
                {payOpts.enable_cashfree && (
                  <button onClick={payCashfree} disabled={paying} data-testid="pay-option-cashfree" className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 hover:border-[#FF8A00] transition disabled:opacity-60">
                    <CreditCard className="w-5 h-5 text-[#FF8A00]"/>
                    <div className="text-left flex-1">
                      <div className="text-sm font-semibold text-[#0F2D5C]">{paying?"Opening…":"Cards / Netbanking"}</div>
                      <div className="text-[11px] text-slate-500">Cashfree secure checkout</div>
                    </div>
                  </button>
                )}
                {payOpts.enable_razorpay && (
                  <div data-testid="pay-option-razorpay" className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 opacity-60">
                    <CreditCard className="w-5 h-5 text-[#FF8A00]"/>
                    <div className="text-left flex-1">
                      <div className="text-sm font-semibold text-[#0F2D5C]">Razorpay</div>
                      <div className="text-[11px] text-slate-500">Coming soon</div>
                    </div>
                  </div>
                )}
                {!payOpts.enable_qr && !payOpts.enable_upi_intent && !payOpts.enable_cashfree && !payOpts.enable_razorpay && (
                  <div className="col-span-full text-sm text-slate-500 text-center py-4">No online payment methods enabled by admin. You can pay your partner directly (cash / UPI) — they will confirm receipt.</div>
                )}
              </div>
              {showQr && payOpts.qr_image_url && (
                <div className="mt-4 p-4 rounded-xl bg-white border border-slate-200 flex flex-col items-center">
                  <img src={payOpts.qr_image_url} alt="UPI QR" className="w-56 h-56 object-contain"/>
                  <div className="mt-3 text-center">
                    <div className="text-sm font-semibold text-[#0F2D5C]">Pay ₹{b.amount}</div>
                    {payOpts.upi_id && <div className="text-xs text-slate-500">UPI: {payOpts.upi_id}</div>}
                    <div className="text-xs text-slate-500 mt-1">After paying, your partner will confirm and we&apos;ll mark this booking as paid.</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Partner card */}
          {b.partner && (
            <div className="mt-4 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400">Assigned partner</div>
                <div className="font-semibold text-[#0F2D5C]">{b.partner.name}</div>
                <div className="text-xs text-slate-500">{b.partner.phone || "Phone hidden"}</div>
              </div>
              <div className="flex gap-2">
                <a href={`tel:${b.partner.phone || ''}`} data-testid="booking-call-partner" className="kh-outline p-2 rounded-full"><Phone className="w-4 h-4"/></a>
                <button data-testid="booking-chat-partner" className="kh-outline p-2 rounded-full"><MessageCircle className="w-4 h-4"/></button>
              </div>
            </div>
          )}

          {/* Actions */}
          {!["completed","cancelled"].includes(b.status) && (
            <button onClick={cancel} data-testid="booking-cancel-button" className="mt-6 w-full py-3 rounded-full border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50">Cancel booking</button>
          )}

          {/* Review */}
          {b.status === "completed" && (
            <div className="mt-6 p-5 rounded-2xl bg-slate-50">
              <div className="font-semibold text-[#0F2D5C]">Rate this service</div>
              <div className="mt-2 flex gap-1">
                {[1,2,3,4,5].map((n)=>(
                  <button key={n} data-testid={`review-star-${n}`} onClick={()=>setRating(n)}>
                    <Star className={`w-6 h-6 ${n<=rating?"fill-[#FF8A00] text-[#FF8A00]":"text-slate-300"}`}/>
                  </button>
                ))}
              </div>
              <textarea data-testid="review-comment-input" value={comment} onChange={(e)=>setComment(e.target.value)} placeholder="Share your experience…" rows={3} className="mt-3 w-full p-3 rounded-xl border border-slate-200 focus:border-[#FF8A00] outline-none"/>
              <button onClick={submitReview} data-testid="review-submit-button" className="mt-3 kh-cta px-5 py-2 text-sm">Submit review</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
