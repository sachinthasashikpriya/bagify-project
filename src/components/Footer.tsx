import { Mail, Phone, MapPin, Facebook, Instagram, Twitter, Send, Heart, ArrowUpRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { toast } from "sonner";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const location = useLocation();
  const isAdminDashboard = location.pathname === "/admin-dashboard";

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Thank you for subscribing to our newsletter!");
  };

  return (
    <footer className={`bg-slate-950 text-slate-400 border-t border-slate-900 relative overflow-hidden ${isAdminDashboard ? "lg:pl-64" : ""}`}>
      {/* Background radial glow */}
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-5">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-purple-900/30">
                B
              </span>
              <span className="text-white text-2xl font-black tracking-tight">
                Bagify
              </span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
              Elevate your carry. Premium handcrafted bags designed for everyday journeys, combining durability, premium materials, and modern utility.
            </p>
            <div className="space-y-3">
              <a href="mailto:support@bagify.com" className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors duration-200 group text-sm">
                <Mail className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" />
                support@bagify.com
              </a>
              <a href="tel:+1234567890" className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors duration-200 group text-sm">
                <Phone className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" />
                +94 70 4429140
              </a>
              <span className="flex items-center gap-3 text-slate-400 text-sm">
                <MapPin className="w-4 h-4 text-purple-500" />
                Katubedda, Moratuwa, Sri Lanka
              </span>
            </div>
          </div>

          {/* Shop Column */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-5">Shop</h3>
            <ul className="space-y-3.5">
              <li>
                <Link to="/" className="text-sm text-slate-400 hover:text-white transition-colors duration-150 flex items-center gap-1.5 group">
                  Tote Bags
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link to="/" className="text-sm text-slate-400 hover:text-white transition-colors duration-150 flex items-center gap-1.5 group">
                  Backpacks
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link to="/" className="text-sm text-slate-400 hover:text-white transition-colors duration-150 flex items-center gap-1.5 group">
                  Crossbody Bags
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link to="/" className="text-sm text-slate-400 hover:text-white transition-colors duration-150 flex items-center gap-1.5 group">
                  Duffle Bags
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link to="/" className="text-sm text-slate-400 hover:text-white transition-colors duration-150 flex items-center gap-1.5 group">
                  Laptop Bags
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-5">Support</h3>
            <ul className="space-y-3.5">
              <li>
                <Link to="/" className="text-sm text-slate-400 hover:text-white transition-colors duration-150">Order Status</Link>
              </li>
              <li>
                <Link to="/" className="text-sm text-slate-400 hover:text-white transition-colors duration-150">Returns & Exchanges</Link>
              </li>
              <li>
                <Link to="/" className="text-sm text-slate-400 hover:text-white transition-colors duration-150">Shipping Info</Link>
              </li>
              <li>
                <Link to="/" className="text-sm text-slate-400 hover:text-white transition-colors duration-150">FAQs</Link>
              </li>
              <li>
                <Link to="/" className="text-sm text-slate-400 hover:text-white transition-colors duration-150">Contact Us</Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-5">Newsletter</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.
            </p>
            <form className="relative" onSubmit={handleSubscribe}>
              <input
                type="email"
                required
                placeholder="Your email address"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-xs transition-all duration-200 placeholder-slate-500 pr-12"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 p-1.5 bg-gradient-to-tr from-purple-600 to-indigo-500 hover:from-purple-700 hover:to-indigo-600 text-white rounded-lg transition-all duration-200 shadow-md shadow-purple-900/40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>

        {/* Bottom Panel */}
        <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <p className="text-xs text-slate-500 tracking-wide">
            &copy; {currentYear} Bagify Inc. All rights reserved. Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline-block animate-pulse mx-0.5" /> in Colombo.
          </p>
          
          <div className="flex items-center gap-6">
            {/* Socials */}
            <div className="flex items-center gap-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-900 hover:bg-purple-600 hover:text-white text-slate-400 rounded-xl transition-all duration-200 hover:-translate-y-0.5">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-900 hover:bg-blue-600 hover:text-white text-slate-400 rounded-xl transition-all duration-200 hover:-translate-y-0.5">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-900 hover:bg-sky-500 hover:text-white text-slate-400 rounded-xl transition-all duration-200 hover:-translate-y-0.5">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
