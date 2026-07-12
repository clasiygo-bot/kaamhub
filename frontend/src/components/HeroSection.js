import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Star,
  ShieldCheck,
  Clock,
  Users,
  Sparkles
} from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-orange-50">

  <div className="absolute -top-32 -left-32 w-80 h-80 bg-orange-300 rounded-full blur-3xl opacity-20"></div>

  <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-300 rounded-full blur-3xl opacity-20"></div>

  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">

    <Sparkles className="w-24 h-24 text-orange-200 opacity-30"/>

  </div>

    </section>
  );
}

<div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-2 gap-14 items-center">

  {/* LEFT SIDE */}

  <div>

    <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-2 rounded-full font-semibold">

      <Star className="w-4 h-4 fill-orange-500" />

      Trusted by 50,000+ Customers

    </div>

    <h1 className="mt-8 text-5xl lg:text-7xl font-extrabold leading-tight text-[#0F2D5C]">

      India's Most Trusted

      <br />

      <span className="text-[#FF8A00]">

        Home Service Platform

      </span>

    </h1>

    <p className="mt-6 text-lg text-gray-600 leading-8 max-w-xl">

      Book verified Electricians, Plumbers, AC Repair,

      Carpenters, Cleaners and many more trusted professionals

      near you in just a few clicks.

    </p>

    <div className="mt-10 flex flex-wrap gap-4">

      <Link

        to="/user/register"

        className="bg-[#FF8A00] hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-semibold inline-flex items-center gap-2 transition"

      >

        Book a Service

        <ArrowRight className="w-5 h-5"/>

      </Link>

      <Link

        to="/partner/register"

        className="border-2 border-[#0F2D5C] text-[#0F2D5C] hover:bg-[#0F2D5C] hover:text-white px-8 py-4 rounded-xl font-semibold transition"

      >

        Become a Partner

      </Link>

    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">

      <div className="bg-white rounded-2xl shadow-lg p-5">

        <ShieldCheck className="text-[#0F2D5C]"/>

        <h3 className="text-2xl font-bold mt-3">10K+</h3>

        <p className="text-gray-500 text-sm">

          Verified Pros

        </p>

      </div>

      <div className="bg-white rounded-2xl shadow-lg p-5">

        <Users className="text-[#FF8A00]"/>

        <h3 className="text-2xl font-bold mt-3">50K+</h3>

        <p className="text-gray-500 text-sm">

          Happy Customers

        </p>

      </div>

      <div className="bg-white rounded-2xl shadow-lg p-5">

        <Clock className="text-[#0F2D5C]"/>

        <h3 className="text-2xl font-bold mt-3">

          24×7

        </h3>

        <p className="text-gray-500 text-sm">

          Support

        </p>

      </div>

      <div className="bg-white rounded-2xl shadow-lg p-5">

        <Star className="text-[#FF8A00] fill-[#FF8A00]"/>

        <h3 className="text-2xl font-bold mt-3">

          4.9★

        </h3>

        <p className="text-gray-500 text-sm">

          Rating

        </p>

      </div>

    </div>

  </div>

  {/* RIGHT SIDE */}

  <div>

  </div>

</div>
<div className="relative flex justify-center items-center">

  {/* Background Glow */}
  <div className="absolute w-[520px] h-[520px] bg-orange-200 rounded-full blur-3xl opacity-30"></div>

  {/* Main Card */}
  <div className="relative bg-white rounded-[40px] shadow-2xl p-8 border border-gray-100">

    <img
      src="/hero-logo.png"
      alt="KaamHub"
      className="w-[420px] max-w-full mx-auto hover:scale-105 transition duration-500"
    />

    {/* Verified */}
    <div className="absolute top-8 -left-8 bg-white rounded-2xl shadow-xl px-5 py-4 flex items-center gap-3 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"

      <ShieldCheck className="text-green-600 w-8 h-8"/>

      <div>
        <h4 className="font-bold text-[#0F2D5C]">
          Verified
        </h4>
        <p className="text-sm text-gray-500">
          Professionals
        </p>
      </div>

    </div>

    {/* Rating */}
    <div className="absolute bottom-8 -right-8 bg-white rounded-2xl shadow-xl px-5 py-4 flex items-center gap-3 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"

      <Star className="text-[#FF8A00] fill-[#FF8A00] w-8 h-8"/>

      <div>
        <h4 className="font-bold text-[#0F2D5C]">
          4.9 Rating
        </h4>
        <p className="text-sm text-gray-500">
          50K+ Reviews
        </p>
      </div>

    </div>

    {/* Support */}
    <div className="absolute left-16 bottom-0 translate-y-1/2 bg-[#0F2D5C] text-white rounded-2xl px-6 py-4 shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"

      <div className="flex items-center gap-3">

        <Clock className="w-6 h-6"/>

        <div>

          <div className="font-bold">

            24×7 Support

          </div>

          <div className="text-sm opacity-80">

            Always Available

          </div>

        </div>

      </div>

    </div>

  </div>

</div>
