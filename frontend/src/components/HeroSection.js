import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Star,
  ShieldCheck,
  Clock,
  Users
} from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-orange-50">

      {/* Background Blur */}
      <div className="absolute -top-40 -left-40 w-[450px] h-[450px] rounded-full bg-orange-300 opacity-20 blur-3xl"></div>

      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-blue-300 opacity-20 blur-3xl"></div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">

        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* LEFT SIDE */}

          <div>

            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-2 rounded-full font-semibold">

              <Star className="w-4 h-4 fill-orange-500"/>

              Trusted by 50,000+ Customers

            </div>

            <h1 className="mt-8 text-5xl lg:text-7xl font-extrabold leading-tight text-[#0F2D5C]">

              India's Most Trusted

              <br/>

              <span className="text-[#FF8A00]">

                Home Service Platform

              </span>

            </h1>

            <p className="mt-6 text-lg text-gray-600 leading-8 max-w-xl">

              Book verified electricians, plumbers,
              AC repair experts, cleaners and
              trusted professionals near you.

            </p>

            <div className="flex flex-wrap gap-4 mt-10">

              <Link
                to="/user/register"
                className="bg-[#FF8A00] hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-semibold flex items-center gap-2 transition"
              >

                Book a Service

                <ArrowRight className="w-5 h-5"/>

              </Link>

              <Link
                to="/partner/register"
                className="border-2 border-[#0F2D5C] text-[#0F2D5C] px-8 py-4 rounded-xl font-semibold hover:bg-[#0F2D5C] hover:text-white transition"
              >

                Become a Partner

              </Link>

            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-14">

              <div className="bg-white rounded-2xl shadow-xl p-5">

                <ShieldCheck className="text-green-600"/>

                <h3 className="text-2xl font-bold mt-3">

                  10K+

                </h3>

                <p className="text-gray-500">

                  Verified Pros

                </p>

              </div>

              <div className="bg-white rounded-2xl shadow-xl p-5">

                <Users className="text-orange-500"/>

                <h3 className="text-2xl font-bold mt-3">

                  50K+

                </h3>

                <p className="text-gray-500">

                  Customers

                </p>

              </div>
                <div className="bg-white rounded-2xl shadow-xl p-5">

                <Clock className="text-blue-600"/>

                <h3 className="text-2xl font-bold mt-3">

                  24×7

                </h3>

                <p className="text-gray-500">

                  Support

                </p>

              </div>

              <div className="bg-white rounded-2xl shadow-xl p-5">

                <Star className="text-yellow-500 fill-yellow-500"/>

                <h3 className="text-2xl font-bold mt-3">

                  4.9★

                </h3>

                <p className="text-gray-500">

                  Rating

                </p>

              </div>

            </div>

          </div>

          {/* RIGHT SIDE */}

          <div className="relative flex justify-center">

            <div className="absolute w-[520px] h-[520px] rounded-full bg-orange-200 blur-3xl opacity-30"></div>

            <div className="relative bg-white rounded-[40px] shadow-2xl p-8 border border-gray-100">

              <img
                src="/hero-logo.png"
                alt="KaamHub"
              />

              {/* Verified Card */}

              <div className="absolute top-8 -left-10 bg-white rounded-2xl shadow-xl px-5 py-4 flex items-center gap-3 hover:-translate-y-2 transition-all duration-300">

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

              {/* Rating Card */}

              <div className="absolute bottom-8 -right-10 bg-white rounded-2xl shadow-xl px-5 py-4 flex items-center gap-3 hover:-translate-y-2 transition-all duration-300">

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

              {/* Support Card */}

              <div className="absolute left-16 bottom-0 translate-y-1/2 bg-[#0F2D5C] text-white rounded-2xl px-6 py-4 shadow-xl hover:-translate-y-2 transition-all duration-300">

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
          </div>

      </div>

    </section>
  );
}
