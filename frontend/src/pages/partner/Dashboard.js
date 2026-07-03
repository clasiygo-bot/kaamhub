import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Wallet, Clock, CheckCircle2, AlertCircle, ArrowRight, Star, Power, Bell, Send } from "lucide-react";
import api, { formatError } from "@/lib/api";
import { toast } from "sonner";
import BannerCarousel from "@/components/BannerCarousel";

export default function PartnerDashboard() {
  const [partner, setPartner] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [wallet, setWallet] = useState({ balance: 0, total_earned: 0 });
  const [available, setAvailable] = useState([]);
  const [banners, setBanners] = useState([]);
  const [bonuses, setBonuses] = useState([]);
  const [notifPerm, setNotifPerm] = useState(typeof Notification !== "undefined" ? Notification.permission : "default");
  const seenIdsRef = useRef(new Set());
  const firstLoadRef = useRef(true);

  const refresh = async () => {
    const [p, b, w] = await Promise.all([
      api.get("/partner/me"),
      api.get("/bookings/mine"),
      api.get("/partner/wallet"),
    ]);
    setPartner(p.data);
    setBookings(b.data);
    setWallet(w.data.wallet);
    if (p.data.status === "approved") {
      const av = await api.get("/bookings/available");
      // detect new bookings vs seen set; on first load just populate seen set
      if (firstLoadRef.current) {
        av.data.forEach((x) => seenIdsRef.current.add(x.id));
        firstLoadRef.current = false;
      } else {
        const fresh = av.data.filter((x) => !seenIdsRef.current.has(x.id));
        fresh.forEach((x) => seenIdsRef.current.add(x.id));
        if (fresh.length > 0 && typeof Notification !== "undefined" && Notification.permission === "granted") {
          try {
            new Notification("🔔 New KaamHub booking", { body: `${fresh[0].service?.name || "Service"} • ${fresh[0].address}`, tag: fresh[0].id });
          } catch { /* noop */ }
        }
      }
      setAvailable(av.data);
    }
  };
  useEffect(() => {
    refresh();
    api.get("/banners", { params: { placement: "partner_home" } }).then((r) => setBanners(r.data)).catch(()=>{});
    api.get("/partner/bonuses").then((r) => setBonuses(r.data)).catch(()=>{});
    const t = setInterval(refresh, 15000);
    return () => clearInterval(t);
  }, []);

  const enableNotifications = async () => {
    if (typeof Notification === "undefined") return toast.error("Notifications not supported on this browser");
    const perm = await Notification.requestPermission();
    setNotifPerm(perm);
    if (perm === "granted") toast.success("Notifications enabled — you'll get instant alerts for new bookings.");
    else toast.error("Notifications blocked. Enable them from your browser settings.");
  };

  const toggleOnline = async () => {
    try { const { data } = await api.post("/partner/online", { online: !partner.online }); setPartner({ ...partner, online: data.online }); }
    catch (e) { toast.error(formatError(e.response?.data?.detail)); }
  };

  const shareOnWA = (b) => {
    const msg = `New KaamHub booking\n\n${b.service?.name}\n${b.address}\n${b.date} at ${b.time}\n₹${b.amount}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  };

  const accept = async (id) => {
    try {
      await api.post(`/bookings/${id}/accept`);
      toast.success("Booking accepted — opening Google Maps…");
      const b = available.find((x) => x.id === id);
      if (b) {
        const dest = (b.lat != null && b.lng != null) ? `${b.lat},${b.lng}` : encodeURIComponent(b.address || "");
        if (dest) {
          window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`, "_blank", "noopener");
        }
      }
      refresh();
    }
    catch (e) { toast.error(formatError(e.response?.data?.detail)); }
  };

  if (!partner) return <div className="py-20 text-center text-slate-400">Loading…</div>;

  // Status gates
  if (partner.status !== "approved") {
    return <StatusGate partner={partner} />;
  }

  const today = new Date().toISOString().slice(0,10);
  const todayJobs = bookings.filter((b)=>b.date === today && !["completed","cancelled"].includes(b.status));
  const completed = bookings.filter((b)=>b.status === "completed").length;

  return (
    <div className="space-y-6">
      {banners.length > 0 && <BannerCarousel banners={banners} testid="partner-home-banners"/>}
      {notifPerm !== "granted" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-amber-600 flex-shrink-0"/>
            <div className="text-sm">
              <div className="font-semibold text-amber-900">Enable instant notifications</div>
              <div className="text-amber-800 text-xs mt-0.5">Get an alert the moment a new booking arrives.</div>
            </div>
          </div>
          <button data-testid="enable-notifications-button" onClick={enableNotifications} className="kh-cta px-4 py-2 text-sm whitespace-nowrap">Turn on</button>
        </div>
      )}

      {/* Status bar */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0F2D5C] to-[#1a3a73] text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs text-white/60">Welcome back</div>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1" style={{fontFamily:"Outfit"}}>Partner Console</h1>
          <div className="mt-2 text-sm text-white/80">{partner.online ? "You are online & receiving requests" : "You are currently offline"}</div>
        </div>
        <button data-testid="partner-online-toggle" onClick={toggleOnline} className={`px-5 py-3 rounded-full font-semibold inline-flex items-center gap-2 ${partner.online?"bg-emerald-500":"bg-white/15"}`}>
          <Power className="w-4 h-4"/> {partner.online ? "Online" : "Go Online"}
        </button>
      </div>

      {/* KPI bento */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI testid="partner-kpi-today" icon={Clock} label="Today's Jobs" value={todayJobs.length}/>
        <KPI testid="partner-kpi-completed" icon={CheckCircle2} label="Completed" value={completed}/>
        <KPI testid="partner-kpi-balance" icon={Wallet} label="Wallet" value={`₹${wallet.balance || 0}`} accent/>
        <KPI testid="partner-kpi-rating" icon={Star} label="Rating" value={partner.rating_avg?.toFixed(1) || "—"}/>
      </div>

      {/* Available bookings */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold" style={{fontFamily:"Outfit"}}>Open requests near you</h2>
          <span className="text-sm text-slate-500">{available.length}</span>
        </div>
        {available.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl text-slate-500">No open requests right now.</div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {available.map((b)=>(
              <div key={b.id} data-testid={`available-booking-${b.id}`} className="rounded-2xl bg-white kh-shadow-card p-4">
                <div className="flex items-center gap-3">
                  <img src={b.service?.image} alt="" className="w-12 h-12 rounded-xl object-cover"/>
                  <div className="flex-1">
                    <div className="font-semibold text-[#0F2D5C]">{b.service?.name}</div>
                    <div className="text-xs text-slate-500">{b.date} • {b.time} • ₹{b.amount}</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-500 line-clamp-2">{b.address}</div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button onClick={()=>accept(b.id)} data-testid={`accept-booking-${b.id}`} className="kh-cta py-2 text-sm">Accept</button>
                  <button onClick={()=>shareOnWA(b)} data-testid={`wa-share-${b.id}`} className="py-2 rounded-full border border-emerald-300 text-emerald-700 text-sm font-semibold inline-flex items-center justify-center gap-1 hover:bg-emerald-50">
                    <Send className="w-3.5 h-3.5"/>WhatsApp
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Today's jobs */}
      <section>
        <h2 className="text-xl font-bold mb-3" style={{fontFamily:"Outfit"}}>Today&apos;s jobs</h2>
        {todayJobs.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl text-slate-500">No jobs today.</div>
        ) : (
          <div className="space-y-2">
            {todayJobs.map((b)=>(
              <Link to={`/partner/jobs`} state={{ open: b.id }} key={b.id} className="flex items-center justify-between bg-white rounded-2xl p-4 kh-shadow-card hover:kh-shadow-hover">
                <div className="flex items-center gap-3">
                  <img src={b.service?.image} alt="" className="w-12 h-12 rounded-xl object-cover"/>
                  <div>
                    <div className="font-semibold text-[#0F2D5C]">{b.service?.name}</div>
                    <div className="text-xs text-slate-500">{b.time} • {b.customer?.name}</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400"/>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Bonuses */}
      {bonuses.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-3" style={{fontFamily:"Outfit"}}>Your bonuses</h2>
          <div className="space-y-2">
            {bonuses.slice(0,5).map((bo)=>(
              <div key={bo.id} data-testid={`bonus-row-${bo.id}`} className="flex items-center justify-between bg-white rounded-2xl p-4 kh-shadow-card">
                <div>
                  <div className="font-semibold text-[#0F2D5C]">🎉 ₹{bo.amount}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{bo.reason}</div>
                </div>
                <div className="text-xs text-slate-400">{new Date(bo.created_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function KPI({ icon:Icon, label, value, accent, testid }) {
  return (
    <div data-testid={testid} className={`rounded-2xl p-5 kh-shadow-card ${accent?"bg-[#FF8A00] text-white":"bg-white"}`}>
      <Icon className={`w-5 h-5 ${accent?"text-white":"text-[#FF8A00]"}`}/>
      <div className={`mt-3 text-sm ${accent?"text-white/80":"text-slate-500"}`}>{label}</div>
      <div className={`mt-1 text-2xl font-bold ${accent?"text-white":"text-[#0F2D5C]"}`}>{value}</div>
    </div>
  );
}

function StatusGate({ partner }) {
  const config = {
    incomplete: { icon: AlertCircle, color: "amber", title: "Complete your profile", body: "Submit your details and documents to start receiving bookings.", cta: "Complete profile", to: "/partner/onboarding" },
    pending: { icon: Clock, color: "blue", title: "Verification in progress", body: "Our team is reviewing your documents. You'll get a notification once approved.", cta: "Update profile", to: "/partner/onboarding" },
    rejected: { icon: AlertCircle, color: "red", title: "Application rejected", body: partner.rejection_reason || "Please re-upload valid documents.", cta: "Re-submit profile", to: "/partner/onboarding" },
  };
  const c = config[partner.status] || config.incomplete;
  return (
    <div className="max-w-xl mx-auto py-10">
      <div className="rounded-3xl bg-white kh-shadow-card p-8 text-center">
        <div className={`w-14 h-14 mx-auto rounded-full bg-${c.color}-100 flex items-center justify-center`}>
          <c.icon className={`w-7 h-7 text-${c.color}-500`}/>
        </div>
        <h2 className="mt-5 text-2xl font-bold" style={{fontFamily:"Outfit"}}>{c.title}</h2>
        <p className="mt-2 text-slate-500">{c.body}</p>
        <Link to={c.to} data-testid="partner-status-cta" className="kh-cta inline-block mt-6 px-6 py-3">{c.cta}</Link>
      </div>
    </div>
  );
}
