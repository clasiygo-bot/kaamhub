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

        {/* Services */}

        <div>

          <h2 className="font-bold text-lg mb-6">
            Services
          </h2>

          <div className="space-y-4">

            <Link to="/customer" className="flex items-center gap-2 hover:text-orange-500">
              <ChevronRight size={16}/>
              Electrician
            </Link>

            <Link to="/customer" className="flex items-center gap-2 hover:text-orange-500">
              <ChevronRight size={16}/>
              Plumber
            </Link>

            <Link to="/customer" className="flex items-center gap-2 hover:text-orange-500">
              <ChevronRight size={16}/>
              AC Repair
            </Link>

            <Link to="/customer" className="flex items-center gap-2 hover:text-orange-500">
              <ChevronRight size={16}/>
              Carpenter
            </Link>

            <Link to="/customer" className="flex items-center gap-2 hover:text-orange-500">
              <ChevronRight size={16}/>
              Cleaning
            </Link>

            <Link to="/customer" className="flex items-center gap-2 hover:text-orange-500">
              <ChevronRight size={16}/>
              Painting
            </Link>

          </div>

        </div>

        {/* Legal */}

        <div>

          <h2 className="font-bold text-lg mb-6">
            Legal
          </h2>

          <div className="space-y-4">

            <Link to="/privacy-policy" className="flex items-center gap-2 hover:text-orange-500">
              <ChevronRight size={16}/>
              Privacy Policy
            </Link>

            <Link to="/terms-and-conditions" className="flex items-center gap-2 hover:text-orange-500">
              <ChevronRight size={16}/>
              Terms & Conditions
            </Link>

            <Link to="/refund-policy" className="flex items-center gap-2 hover:text-orange-500">
              <ChevronRight size={16}/>
              Refund Policy
            </Link>

            <Link to="/cancellation-policy" className="flex items-center gap-2 hover:text-orange-500">
              <ChevronRight size={16}/>
              Cancellation Policy
            </Link>

          </div>

        </div>

        {/* Support */}

        <div>

          <h2 className="font-bold text-lg mb-6">
            Support
          </h2>

          <div className="space-y-6">

            <div className="flex gap-3">

              <Mail className="text-orange-500"/>

              <div>

                <p className="font-semibold">
                  Email
                </p>

                <p className="text-gray-400">
                  support@kaamhub.in
                </p>

              </div>

            </div>

            <div className="flex gap-3">

              <Phone className="text-orange-500"/>

              <div>

                <p className="font-semibold">
                  Phone
                </p>

                <p className="text-gray-400">
                  +91 86574 48453
                </p>

              </div>

            </div>

            <div className="flex gap-3">

              <MapPin className="text-orange-500"/>

              <div>

                <p className="font-semibold">
                  Address
                </p>

                <p className="text-gray-400">
                  Mumbai,
                  Maharashtra,
                  India
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>

            {/* Bottom Bar */}

      <div className="border-t border-white/10">

        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4">

          <p className="text-sm text-gray-400 text-center md:text-left">
            © {new Date().getFullYear()} KaamHub. All Rights Reserved.
          </p>

          <div className="flex items-center gap-6 text-sm text-gray-400">

            <span>🔒 Secure Payments</span>

            <span>🇮🇳 Made in India</span>

          </div>

        </div>

      </div>

    </footer>
  );
}
