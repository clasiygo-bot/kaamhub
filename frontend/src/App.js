import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Splash from "@/components/Splash";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import LoginScoped from "@/pages/LoginScoped";
import RegisterScoped from "@/pages/RegisterScoped";

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
import AdminUserDetail from "@/pages/admin/UserDetail";
import AdminPaymentSettings from "@/pages/admin/PaymentSettings";
import AdminBanners from "@/pages/admin/Banners";
import AdminTickets from "@/pages/admin/Tickets";
import Support from "@/pages/Support";
import PaymentResult from "@/pages/PaymentResult";

import AboutUs from "@/pages/AboutUs";

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-4xl font-bold text-center text-[#FF8A00] mb-6">
          About KaamHub
        </h1>

        <p className="text-gray-700 text-lg leading-8 mb-6">
          <strong>KaamHub</strong> is India's trusted home service platform
          that connects customers with verified professionals in just a few
          minutes. Our mission is to make booking home services simple, fast,
          safe, and affordable.
        </p>

        <h2 className="text-2xl font-semibold text-[#0F172A] mb-3">
          Our Mission
        </h2>

        <p className="text-gray-700 leading-8 mb-6">
          We aim to provide reliable home services within 10 minutes while
          creating employment opportunities for skilled professionals across
          India.
        </p>

        <h2 className="text-2xl font-semibold text-[#0F172A] mb-3">
          Services We Offer
        </h2>

        <ul className="list-disc pl-6 text-gray-700 leading-8 mb-6">
          <li>Plumber</li>
          <li>Electrician</li>
          <li>Carpenter</li>
          <li>AC Repair</li>
          <li>Cleaning Services</li>
          <li>Painting</li>
          <li>Appliance Repair</li>
          <li>Home Maintenance</li>
        </ul>

        <h2 className="text-2xl font-semibold text-[#0F172A] mb-3">
          Why Choose KaamHub?
        </h2>

        <ul className="list-disc pl-6 text-gray-700 leading-8 mb-6">
          <li>Verified Service Professionals</li>
          <li>Fast Booking Process</li>
          <li>Transparent Pricing</li>
          <li>Secure Payments</li>
          <li>Real-Time Booking Updates</li>
          <li>Dedicated Customer Support</li>
        </ul>

        <h2 className="text-2xl font-semibold text-[#0F172A] mb-3">
          Contact Us
        </h2>

        <p className="text-gray-700 leading-8">
          <strong>Website:</strong> https://kaamhub-frontend.onrender.com
          <br />
          <strong>Email:</strong> support@kaamhub.in
        </p>

        <div className="mt-10 text-center text-gray-500">
          © 2026 KaamHub. All Rights Reserved.
        </div>
      </div>
    </div>
  );
}
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
      <Route path="/user/login" element={<LoginScoped role="customer" heroTitle={<>Welcome back <br/><span className="text-[#FF8A00]">Customer</span></>} heroSubtitle="Book verified pros — pay only after the job." />} />
      <Route path="/user/register" element={<RegisterScoped role="customer" heroTitle={<>Book home services <br/><span className="text-[#FF8A00]">at your doorstep</span></>} ctaLabel="Create customer account"/>} />
      <Route path="/partner/login" element={<LoginScoped role="partner" heroTitle={<>Welcome back <br/><span className="text-[#FF8A00]">Partner</span></>} heroSubtitle="Earn on your own schedule. Get instant job alerts." features={["Instant booking alerts","Weekly payouts","Rating-based bonuses"]}/>} />
      <Route path="/partner/register" element={<RegisterScoped role="partner" heroTitle={<>Earn with <span className="text-[#FF8A00]">KaamHub</span></>} heroSubtitle="Sign up. Verify. Start earning within 24 hrs." ctaLabel="Become a partner"/>} />
      <Route path="/payment/:result" element={<PaymentResult />} />

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
      <Route path="/customer/support" element={<ProtectedRoute roles={["customer"]}><CustomerLayout><Support/></CustomerLayout></ProtectedRoute>} />

      {/* Partner */}
      <Route path="/partner" element={<ProtectedRoute roles={["partner"]}><PartnerLayout><PartnerDashboard/></PartnerLayout></ProtectedRoute>} />
      <Route path="/partner/onboarding" element={<ProtectedRoute roles={["partner"]}><PartnerLayout><PartnerOnboarding/></PartnerLayout></ProtectedRoute>} />
      <Route path="/partner/jobs" element={<ProtectedRoute roles={["partner"]}><PartnerLayout><PartnerJobs/></PartnerLayout></ProtectedRoute>} />
      <Route path="/partner/wallet" element={<ProtectedRoute roles={["partner"]}><PartnerLayout><PartnerWallet/></PartnerLayout></ProtectedRoute>} />
      <Route path="/partner/support" element={<ProtectedRoute roles={["partner"]}><PartnerLayout><Support/></PartnerLayout></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminLayout><AdminDashboard/></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/verifications" element={<ProtectedRoute roles={["admin"]}><AdminLayout><AdminVerifications/></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/bookings" element={<ProtectedRoute roles={["admin"]}><AdminLayout><AdminBookings/></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/payouts" element={<ProtectedRoute roles={["admin"]}><AdminLayout><AdminPayouts/></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/services" element={<ProtectedRoute roles={["admin"]}><AdminLayout><AdminServices/></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={["admin"]}><AdminLayout><AdminUsers/></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/users/:id" element={<ProtectedRoute roles={["admin"]}><AdminLayout><AdminUserDetail/></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/payment-settings" element={<ProtectedRoute roles={["admin"]}><AdminLayout><AdminPaymentSettings/></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/banners" element={<ProtectedRoute roles={["admin"]}><AdminLayout><AdminBanners/></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/tickets" element={<ProtectedRoute roles={["admin"]}><AdminLayout><AdminTickets/></AdminLayout></ProtectedRoute>} />
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
