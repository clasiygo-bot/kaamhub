import React, { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import api from "@/lib/api";
import Logo from "@/components/Logo";

export default function PaymentResult() {
  const { result } = useParams(); // "success" | "failed"
  const [params] = useSearchParams();
  const bookingId = params.get("booking");
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    if (!bookingId) return;
    api.get(`/bookings/${bookingId}`).then((r)=>setBooking(r.data)).catch(()=>{});
  }, [bookingId]);

  const ok = result === "success";
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center"><Logo/></div>
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        <div data-testid={`payment-result-${result}`} className="w-full max-w-md rounded-3xl bg-white kh-shadow-card p-8 text-center">
          {ok ? (
            <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-500"/>
          ) : (
            <XCircle className="w-16 h-16 mx-auto text-red-500"/>
          )}
          <h1 className="mt-4 text-2xl font-bold" style={{fontFamily:"Outfit"}}>
            {ok ? "Payment Successful!" : "Payment Failed"}
          </h1>
          <p className="mt-2 text-slate-500">
            {ok
              ? "Your payment was received. Our partner will be in touch shortly."
              : "Something went wrong with your payment. You can try again from your booking."}
          </p>
          {booking && (
            <div className="mt-6 p-4 rounded-2xl bg-slate-50 text-left text-sm">
              <div className="text-xs text-slate-400">Booking</div>
              <div className="font-semibold text-[#0F2D5C]">{booking.service?.name}</div>
              <div className="text-xs text-slate-500 mt-1">{booking.date} • {booking.time}</div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-slate-500">Amount</span>
                <span className="font-bold text-[#0F2D5C]">₹{booking.amount}</span>
              </div>
            </div>
          )}
          {bookingId ? (
            <Link to={`/customer/bookings/${bookingId}`} data-testid="payment-result-view-booking" className="kh-cta inline-flex items-center gap-1 px-5 py-2.5 mt-6 text-sm">View booking <ArrowRight className="w-4 h-4"/></Link>
          ) : (
            <Link to="/customer" data-testid="payment-result-home" className="kh-cta inline-flex items-center gap-1 px-5 py-2.5 mt-6 text-sm">Go to home</Link>
          )}
        </div>
      </main>
    </div>
  );
}
