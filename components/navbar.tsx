"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, LayoutDashboard } from "lucide-react";
import { useUser, SignOutButton } from "@clerk/nextjs";

const NAV_LINKS = [
  { href: "/services", label: "Services" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Sign In" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isSignedIn } = useUser();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? "bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm" : "bg-transparent"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5" onClick={() => setIsOpen(false)}>
            <Image src="/logo.svg" alt="Apex Visual" width={140} height={56} className="h-9 w-auto" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isSignedIn ? (
              <>
                <Link href="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors">
                  <LayoutDashboard className="h-4 w-4" />Dashboard
                </Link>
                <SignOutButton redirectUrl="/">
                  <button className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                    Sign out
                  </button>
                </SignOutButton>
              </>
            ) : null}
          </div>

          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-controls="mobile-nav"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div id="mobile-nav" className="md:hidden bg-white border-t border-gray-200 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="px-4 py-4 space-y-1">
            {NAV_LINKS.flatMap((link) =>
              [
                <Link key={link.href} href={link.href}
                  className="block text-sm font-medium text-gray-600 py-2 hover:text-gray-900 px-3 rounded-lg hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}>{link.label}</Link>,
              ]
            )}
            <div className="pt-3 border-t border-gray-200 flex flex-col gap-2">
              {isSignedIn ? (
                <>
                  <Link href="/dashboard" onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-gray-300 text-sm font-medium text-gray-900">
                    <LayoutDashboard className="h-4 w-4" />Dashboard
                  </Link>
                  <SignOutButton redirectUrl="/">
                    <button className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 text-left hover:text-gray-900">
                      Sign out
                    </button>
                  </SignOutButton>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
