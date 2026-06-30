import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Splash from "@/components/Splash";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";

import CustomerLayout from "@/components/CustomerLayout";
import CustomerHome from "@/pages/customer/Home";
import CustomerServiceDetail from "@/pages/customer/ServiceDetail";
import CustomerBooking from "@/pages/customer/Booking";
import CustomerBookings from "@/pages/customer/Bookings";
import CustomerBookingDetail from "@/pages/customer/BookingDetail";
import CustomerProfile from "@/pages/customer/Profile";
import CustomerNotifications from "@/pages/customer/Notifications";

import PartnerLayout from "@/components/PartnerLayout";
import PartnerDashboard from "@/pages/partner/Dashboard";
import PartnerOnboarding from "@/pages/partner/Onboarding";
import PartnerJobs from "@/pages/partner/Jobs";
import PartnerWallet from "@/pages/partner/Wallet";

import AdminLayout from "@/components/AdminLayout";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminVerifications from "@/pages/admin/Verifications";
import AdminBookings from "@/pages/admin/Bookings";
import AdminPayouts from "@/pages/admin/Payouts";
import AdminServices from "@/pages/admin/Services";
import AdminUsers from "@/pages/admin/Users";
import AdminOffers from "@/pages/admin/Offers";

import "@/App.css";

function RoleHomeRedirect() {
  const { user } = useAuth();
  if (user?.role === "customer") return <Navigate to="/customer" replace />;
  if (user?.role === "partner") return <Navigate to="/partner" replace />;
  if (user?.role === "admin") return <Navigate to="/admin" replace />;
  return <Landing />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RoleHomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Customer */}
      <Route
        path="/customer"
        element={
          <ProtectedRoute roles={["customer"]}>
            <CustomerLayout><CustomerHome /></CustomerLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/customer/service/:id" element={<ProtectedRoute roles={["customer"]}><CustomerLayout><CustomerServiceDetail/></CustomerLayout></ProtectedRoute>} />
      <Route path="/customer/book/:id" element={<ProtectedRoute roles={["customer"]}><CustomerLayout><CustomerBooking/></CustomerLayout></ProtectedRoute>} />
      <Route path="/customer/bookings" element={<ProtectedRoute roles={["customer"]}><CustomerLayout><CustomerBookings/></CustomerLayout></ProtectedRoute>} />
      <Route path="/customer/bookings/:id" element={<ProtectedRoute roles={["customer"]}><CustomerLayout><CustomerBookingDetail/></CustomerLayout></ProtectedRoute>} />
      <Route path="/customer/profile" element={<ProtectedRoute roles={["customer"]}><CustomerLayout><CustomerProfile/></CustomerLayout></ProtectedRoute>} />
      <Route path="/customer/notifications" element={<ProtectedRoute roles={["customer"]}><CustomerLayout><CustomerNotifications/></CustomerLayout></ProtectedRoute>} />

      {/* Partner */}
      <Route path="/partner" element={<ProtectedRoute roles={["partner"]}><PartnerLayout><PartnerDashboard/></PartnerLayout></ProtectedRoute>} />
      <Route path="/partner/onboarding" element={<ProtectedRoute roles={["partner"]}><PartnerLayout><PartnerOnboarding/></PartnerLayout></ProtectedRoute>} />
      <Route path="/partner/jobs" element={<ProtectedRoute roles={["partner"]}><PartnerLayout><PartnerJobs/></PartnerLayout></ProtectedRoute>} />
      <Route path="/partner/wallet" element={<ProtectedRoute roles={["partner"]}><PartnerLayout><PartnerWallet/></PartnerLayout></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminLayout><AdminDashboard/></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/verifications" element={<ProtectedRoute roles={["admin"]}><AdminLayout><AdminVerifications/></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/bookings" element={<ProtectedRoute roles={["admin"]}><AdminLayout><AdminBookings/></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/payouts" element={<ProtectedRoute roles={["admin"]}><AdminLayout><AdminPayouts/></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/services" element={<ProtectedRoute roles={["admin"]}><AdminLayout><AdminServices/></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={["admin"]}><AdminLayout><AdminUsers/></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/offers" element={<ProtectedRoute roles={["admin"]}><AdminLayout><AdminOffers/></AdminLayout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const [splashed, setSplashed] = useState(false);
  return (
    <AuthProvider>
      <BrowserRouter>
        {!splashed && <Splash onDone={() => setSplashed(true)} />}
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </AuthProvider>
  );
}
