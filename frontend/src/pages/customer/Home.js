import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, Wrench, Zap, Sparkles, Wind, Hammer, Star, ArrowRight, Tag } from "lucide-react";
import api from "@/lib/api";
import { detectLocation, getCachedLocation, clearLocationCache } from "@/lib/location";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const iconMap = { wrench: Wrench, zap: Zap, sparkles: Sparkles, wind: Wind, hammer: Hammer };

export default function CustomerHome() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [offers, setOffers] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [location, setLocation] = useState(getCachedLocation()?.short_name || "Detecting…");
  const [locating, setLocating] = useState(false);

  const detect = async (force = false) => {
    setLocating(true);
    try {
      if (force) clearLocationCache();
      const loc = await detectLocation({ useCache: !force });
      setLocation(loc.short_name);
      if (force) toast.success("Location refreshed");
    } catch (e) {
      setLocation("Set Location");
      if (force) toast.error("Location permission denied");
    } finally { setLocating(false); }
  };

  useEffect(() => {
    api.get("/services").then((r) => setServices(r.data));
    api.get("/categories").then((r) => setCategories(r.data));
    api.get("/offers").then((r) => setOffers(r.data));
    api.get("/bookings/mine").then((r) => setRecentBookings(r.data.slice(0, 3)));
    if (!getCachedLocation()) detect(false); else setLocation(getCachedLocation().short_name);
  }, []);

  const filtered = useMemo(() => {
    return services.filter((s) =>
      (activeCat === "All" || s.category === activeCat) &&
      (search === "" || s.name.toLowerCase().includes(search.toLowerCase()))
    );
  }, [services, search, activeCat]);

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="rounded-3xl bg-gradient-to-br from-[#0F2D5C] to-[#1a3a73] text-white p-6 sm:p-10 kh-shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <button onClick={() => detect(true)} data-testid="home-refresh-location" className="text-xs text-white/60 hover:text-white inline-flex items-center gap-1.5 group">
              <MapPin className="w-3 h-3"/> <span className="truncate max-w-[200px] sm:max-w-md">{locating ? "Detecting…" : location}</span>
              <span className="text-[10px] text-white/40 group-hover:text-white/80 ml-1">tap to refresh</span>
            </button>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold" style={{fontFamily:"Outfit"}}>
              Hi {user?.name?.split(" ")[0] || "there"} 👋
            </h1>
            <p className="text-white/80 mt-1 text-sm">What kaam do you need today?</p>
          </div>
          <div className="hidden sm:flex items-center kh-chip bg-orange-100 text-[#FF8A00]"><Star className="w-3 h-3 mr-1 fill-[#FF8A00]"/> 4.8/5</div>
        </div>
        <div className="mt-6 relative">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
          <input
            data-testid="home-search-input"
            value={search} onChange={(e)=>setSearch(e.target.value)}
            placeholder="Search 'AC service', 'plumber'…"
            className="w-full bg-white text-slate-900 pl-11 pr-4 py-3 rounded-full outline-none focus:ring-4 focus:ring-[#FF8A00]/30"
          />
        </div>
      </section>

      {/* Offers */}
      {offers.length > 0 && (
        <section>
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-xl font-bold" style={{fontFamily:"Outfit"}}>Offers for you</h2>
            <Tag className="w-4 h-4 text-[#FF8A00]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {offers.map((o) => (
              <div data-testid={`offer-card-${o.code}`} key={o.id} className="rounded-2xl overflow-hidden kh-shadow-card relative bg-white">
                <img src={o.image} alt={o.title} className="w-full h-32 object-cover" />
                <div className="p-4">
                  <span className="kh-chip bg-orange-100 text-[#FF8A00]">{o.code}</span>
                  <div className="mt-2 font-semibold text-[#0F2D5C]">{o.title}</div>
                  <div className="text-xs text-slate-500 mt-1">{o.description}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      <section>
        <h2 className="text-xl font-bold mb-4" style={{fontFamily:"Outfit"}}>Browse by category</h2>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {["All", ...categories.map((c)=>c.name)].map((c) => (
            <button
              key={c}
              data-testid={`category-chip-${c.toLowerCase().replace(/ /g,'-')}`}
              onClick={() => setActiveCat(c)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                activeCat === c ? "bg-[#0F2D5C] text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {categories.map((c) => {
            const Icon = iconMap[c.icon] || Wrench;
            return (
              <button key={c.id} onClick={() => setActiveCat(c.name)} data-testid={`category-card-${c.name.toLowerCase().replace(/ /g,'-')}`} className="bg-white rounded-2xl p-4 kh-shadow-card hover:kh-shadow-hover text-left transition">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF8A00] flex items-center justify-center"><Icon className="w-5 h-5"/></div>
                <div className="mt-3 font-semibold text-[#0F2D5C] text-sm">{c.name}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Services */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-xl font-bold" style={{fontFamily:"Outfit"}}>Popular services</h2>
          <span className="text-sm text-slate-500">{filtered.length} found</span>
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500 bg-slate-50 rounded-2xl">No services match your search.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((s) => (
              <Link to={`/customer/service/${s.id}`} key={s.id} data-testid={`service-card-${s.id}`} className="bg-white rounded-2xl overflow-hidden kh-shadow-card hover:kh-shadow-hover transition group">
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={s.image} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500"/>
                </div>
                <div className="p-4">
                  <span className="kh-chip bg-slate-100 text-slate-600 text-[10px]">{s.category}</span>
                  <h3 className="mt-2 font-semibold text-[#0F2D5C]">{s.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{s.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400">Starting at</div>
                      <div className="text-lg font-bold text-[#0F2D5C]">₹{s.price}</div>
                    </div>
                    <span className="kh-cta px-4 py-1.5 text-sm inline-flex items-center gap-1">Book <ArrowRight className="w-3 h-3"/></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent bookings */}
      {recentBookings.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4" style={{fontFamily:"Outfit"}}>Recent bookings</h2>
          <div className="space-y-3">
            {recentBookings.map((b) => (
              <Link to={`/customer/bookings/${b.id}`} key={b.id} data-testid={`recent-booking-${b.id}`} className="flex items-center justify-between bg-white rounded-2xl p-4 kh-shadow-card hover:kh-shadow-hover transition">
                <div className="flex items-center gap-3">
                  <img src={b.service?.image} alt="" className="w-12 h-12 rounded-xl object-cover" />
                  <div>
                    <div className="font-semibold text-[#0F2D5C] text-sm">{b.service?.name}</div>
                    <div className="text-xs text-slate-500">{b.date} • {b.time}</div>
                  </div>
                </div>
                <StatusBadge status={b.status} />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: "bg-slate-100 text-slate-600",
    accepted: "bg-blue-100 text-blue-700",
    on_the_way: "bg-amber-100 text-amber-700",
    started: "bg-orange-100 text-orange-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
  };
  return <span className={`kh-chip ${map[status] || "bg-slate-100"}`}>{status.replace("_"," ")}</span>;
}
