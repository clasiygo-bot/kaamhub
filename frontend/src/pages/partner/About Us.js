import React from "react";

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
