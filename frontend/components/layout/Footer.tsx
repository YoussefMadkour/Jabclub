'use client';

import Link from 'next/link';
import ApexLogo from './ApexLogo';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-line mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div>
            <ApexLogo className="h-6 mb-4 text-headline" />
            <p className="text-muted text-sm max-w-xs">
              The member platform for Apex Martial Arts. Book classes, track your training, and stay connected with the community.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="eyebrow mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/classes" 
                  className="text-muted hover:text-headline transition-colors text-sm"
                >
                  Browse Classes
                </Link>
              </li>
              <li>
                <Link 
                  href="/purchase" 
                  className="text-muted hover:text-headline transition-colors text-sm"
                >
                  Purchase Package
                </Link>
              </li>
              <li>
                <Link 
                  href="/dashboard" 
                  className="text-muted hover:text-headline transition-colors text-sm"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="eyebrow mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/privacy-policy" 
                  className="text-muted hover:text-headline transition-colors text-sm"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms-of-service" 
                  className="text-muted hover:text-headline transition-colors text-sm"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-8 border-t border-line">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted text-sm text-center md:text-left">
              © {currentYear} Apex Martial Arts. All rights reserved.
            </p>
            <p className="text-muted text-xs text-center md:text-right tracking-widest uppercase">
              Members Only
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
