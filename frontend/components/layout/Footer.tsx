'use client';

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 border-t border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div>
            <h3 className="text-white text-xl font-bold mb-4">
              <span className="text-[#FF7A00]">Jab</span>Club
            </h3>
            <p className="text-gray-400 text-sm">
              Your premier boxing gym membership platform. Book classes, track progress, and connect with the JabClub community.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/classes" 
                  className="text-gray-400 hover:text-[#FF7A00] transition-colors text-sm"
                >
                  Browse Classes
                </Link>
              </li>
              <li>
                <Link 
                  href="/purchase" 
                  className="text-gray-400 hover:text-[#FF7A00] transition-colors text-sm"
                >
                  Purchase Package
                </Link>
              </li>
              <li>
                <Link 
                  href="/dashboard" 
                  className="text-gray-400 hover:text-[#FF7A00] transition-colors text-sm"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/privacy-policy" 
                  className="text-gray-400 hover:text-[#FF7A00] transition-colors text-sm"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms-of-service" 
                  className="text-gray-400 hover:text-[#FF7A00] transition-colors text-sm"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm text-center md:text-left">
              © {currentYear} JabClub. All rights reserved.
            </p>
            <p className="text-gray-500 text-xs text-center md:text-right">
              For JabClub Gym Members Only
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
