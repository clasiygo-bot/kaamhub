import {
  ShieldCheck,
  Zap,
  BadgeCheck,
  Headphones,
  Star,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  Facebook,
  Instagram,
  Linkedin,
  Youtube
} from "lucide-react";

import { Link } from "react-router-dom";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="bg-[#08111F] text-white mt-24">

      {/* Top Border */}
      <div className="border-b border-white/10">

        <div className="max-w-7xl mx-auto px-6 py-8 grid md:grid-cols-5 grid-cols-2 gap-6">

          <div className="flex items-center gap-3">
            <ShieldCheck className="text-orange-500" size={40}/>
            <div>
              <h3 className="font-semibold">
                Verified Professionals
              </h3>

              <p className="text-sm text-gray-400">
                Trusted & Verified Experts
              </p>

            </div>
          </div>

          <div className="flex items-center gap-3">

            <Zap className="text-orange-500" size={40}/>

            <div>

              <h3 className="font-semibold">
                Fast Service
              </h3>

              <p className="text-sm text-gray-400">
                On-time Doorstep Service
              </p>

            </div>

          </div>

          <div className="flex items-center gap-3">

            <BadgeCheck className="text-orange-500" size={40}/>

            <div>

              <h3 className="font-semibold">
                Secure Payments
              </h3>

              <p className="text-sm text-gray-400">
                100% Safe Transactions
              </p>

            </div>

          </div>

          <div className="flex items-center gap-3">

            <Headphones className="text-orange-500" size={40}/>

            <div>

              <h3 className="font-semibold">
                24×7 Support
              </h3>

              <p className="text-sm text-gray-400">
                Always Ready to Help
              </p>

            </div>

          </div>

          <div className="flex items-center gap-3">

            <Star className="text-orange-500" size={40}/>

            <div>

              <h3 className="font-semibold">
                4.8★ Rated
              </h3>

              <p className="text-sm text-gray-400">
                Loved by Customers
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* Main Footer */}

      <div className="max-w-7xl mx-auto px-6 py-14 grid lg:grid-cols-5 md:grid-cols-3 gap-12">

        {/* Logo */}

        <div>

          <Logo />

          <p className="text-gray-400 mt-5 leading-8">

            KaamHub connects trusted professionals with customers for reliable home services across India.

          </p>

          <div className="flex gap-4 mt-8">

            <a href="#">
              <Instagram className="hover:text-orange-500"/>
            </a>

            <a href="#">
              <Facebook className="hover:text-orange-500"/>
            </a>

            <a href="#">
              <Linkedin className="hover:text-orange-500"/>
            </a>

            <a href="#">
              <Youtube className="hover:text-orange-500"/>
            </a>

          </div>

        </div>

        {/* Company */}

        <div>

          <h2 className="font-bold text-lg mb-6">
            Company
          </h2>

          <div className="space-y-4">

            <Link to="/about-us" className="flex items-center gap-2 hover:text-orange-500">
              <ChevronRight size={16}/>
              About Us
            </Link>

            <Link to="/contact-us" className="flex items-center gap-2 hover:text-orange-500">
              <ChevronRight size={16}/>
              Contact Us
            </Link>

            <Link to="#">
              <div className="flex items-center gap-2 hover:text-orange-500">
                <ChevronRight size={16}/>
                Careers
              </div>
            </Link>

            <Link to="#">
              <div className="flex items-center gap-2 hover:text-orange-500">
                <ChevronRight size={16}/>
                Blog
              </div>
            </Link>

          </div>

        </div>
