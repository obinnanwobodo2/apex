import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin, Globe } from "lucide-react";

const FOOTER_LINKS = {
  Company: [
    { label: "Home", href: "/" },
    { label: "About Us", href: "/about" },
    { label: "Portfolio", href: "/portfolio" },
    { label: "Contact", href: "/contact" },
  ],
  Services: [
    { label: "Website Design & Build", href: "/services" },
    { label: "Monthly Website Care", href: "/services" },
    { label: "SEO Optimisation", href: "/services" },
    { label: "E-Commerce Setup", href: "/services" },
    { label: "AI-Powered CRM", href: "/services" },
  ],
  Domains: [
    { label: "Domain Search", href: "/dashboard/domains" },
    { label: ".co.za Registration", href: "/dashboard/domains" },
    { label: ".com Registration", href: "/dashboard/domains" },
    { label: "Domain Transfer", href: "/contact" },
  ],
  Support: [
    { label: "Client Dashboard", href: "/dashboard" },
    { label: "Submit a Ticket", href: "/dashboard/support" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "FAQ", href: "/#faq" },
  ],
};

const LEGAL = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
  { label: "Cookie Policy", href: "/cookie-policy" },
  { label: "Refund Policy", href: "/refund-policy" },
];

const SOCIAL = [
  { abbr: "X", href: "https://twitter.com", label: "Twitter / X" },
  { abbr: "in", href: "https://linkedin.com", label: "LinkedIn" },
  { abbr: "ig", href: "https://instagram.com", label: "Instagram" },
  { abbr: "fb", href: "https://facebook.com", label: "Facebook" },
];

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-12">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-5">
              <Image src="/logo.svg" alt="Apex Visuals" width={140} height={56} className="h-9 w-auto" />
            </Link>
            <p className="text-sm text-gray-600 leading-relaxed mb-6 max-w-xs">
              South Africa&apos;s modern web design and digital services agency. We build, manage
              and grow your online presence with monthly retainer packages.
            </p>

            {/* Contact */}
            <div className="space-y-2.5">
              <a href="mailto:info@apexvisual.co.za"
                className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-gray-900 transition-colors group break-all">
                <Mail className="h-4 w-4 text-brand-green flex-shrink-0" />
                info@apexvisual.co.za
              </a>
              <a href="tel:+27754598388"
                className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                <Phone className="h-4 w-4 text-brand-green flex-shrink-0" />
                +27 75 459 8388
              </a>
              <div className="flex items-center gap-2.5 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-brand-green flex-shrink-0" />
                Johannesburg, South Africa
              </div>
              <a href="https://apexvisual.co.za" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-gray-900 transition-colors break-all">
                <Globe className="h-4 w-4 text-brand-green flex-shrink-0" />
                apexvisual.co.za
              </a>
            </div>

            {/* Social */}
            <div className="flex items-center gap-2 mt-6">
              {SOCIAL.map(({ abbr, href, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                  className="w-8 h-8 rounded-lg bg-white border border-gray-300 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:border-gray-400 transition-colors text-[10px] font-bold uppercase">
                  {abbr}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href}
                      className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500 text-center sm:text-left">
            © {new Date().getFullYear()} Apex Visuals (Pty) Ltd. All rights reserved. Reg. No. 2025/876555/07
          </p>
          <div className="flex flex-wrap items-center gap-4">
            {LEGAL.map((l) => (
              <Link key={l.label} href={l.href}
                className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
