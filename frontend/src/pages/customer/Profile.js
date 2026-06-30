import React from "react";
import { Mail, Phone, Shield, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold" style={{fontFamily:"Outfit"}}>My Profile</h1>
      <div className="rounded-3xl bg-white kh-shadow-card p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#0F2D5C] text-white flex items-center justify-center font-bold text-2xl">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <div className="text-xl font-bold text-[#0F2D5C]">{user?.name}</div>
            <span className="kh-chip bg-orange-100 text-[#FF8A00] mt-1 inline-block">{user?.role}</span>
          </div>
        </div>
        <div className="mt-6 space-y-3 text-sm">
          <Row icon={Mail} label="Email" value={user?.email}/>
          <Row icon={Phone} label="Phone" value={user?.phone || "—"}/>
          <Row icon={Shield} label="Account" value="Active"/>
        </div>
      </div>
      <button onClick={async()=>{await logout(); nav("/login");}} data-testid="profile-logout-button" className="w-full py-3 rounded-full border border-red-200 text-red-600 font-semibold hover:bg-red-50 inline-flex items-center justify-center gap-2">
        <LogOut className="w-4 h-4"/> Sign out
      </button>
    </div>
  );
}

const Row = ({icon:Icon, label, value}) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
    <div className="flex items-center gap-2 text-slate-500"><Icon className="w-4 h-4"/>{label}</div>
    <div className="text-[#0F2D5C] font-medium">{value}</div>
  </div>
);
