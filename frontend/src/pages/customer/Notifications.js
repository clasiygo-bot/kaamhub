import React, { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import api from "@/lib/api";

export default function Notifications() {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get("/notifications").then((r)=>setItems(r.data)); }, []);
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6" style={{fontFamily:"Outfit"}}>Notifications</h1>
      {items.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-3xl">
          <Bell className="w-10 h-10 mx-auto text-slate-300"/>
          <div className="mt-3 text-slate-500">You&apos;re all caught up!</div>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <div key={n.id} data-testid={`notification-${n.id}`} className={`rounded-2xl p-4 kh-shadow-card bg-white ${!n.read?"border-l-4 border-[#FF8A00]":""}`}>
              <div className="font-semibold text-[#0F2D5C]">{n.title}</div>
              <div className="text-sm text-slate-500 mt-1">{n.body}</div>
              <div className="text-xs text-slate-400 mt-2">{new Date(n.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
