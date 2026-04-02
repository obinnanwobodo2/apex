"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, TrendingUp, CheckSquare, Zap, Bot,
  LogOut, Menu, ChevronRight, Bell, ArrowLeft,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useUser, useClerk } from "@clerk/nextjs";

const INACTIVITY_TIMEOUT = 15 * 60 * 1000;

const NAV_ITEMS = [
  { href: "/crm", icon: <LayoutDashboard className="h-4 w-4" />, label: "Overview" },
  { href: "/crm/contacts", icon: <Users className="h-4 w-4" />, label: "Contacts" },
  { href: "/crm/pipeline", icon: <TrendingUp className="h-4 w-4" />, label: "Pipeline" },
  { href: "/crm/tasks", icon: <CheckSquare className="h-4 w-4" />, label: "Tasks" },
  { href: "/crm/integrations", icon: <Zap className="h-4 w-4" />, label: "Integrations" },
  { href: "/crm/ai", icon: <Bot className="h-4 w-4" />, label: "AI Assistant" },
];

export default function CrmShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayName = user?.fullName || user?.emailAddresses[0]?.emailAddress?.split("@")[0] || "User";
  const email = user?.emailAddresses[0]?.emailAddress || "";
  const initials = displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const avatarUrl = user?.imageUrl || "";

  const handleSignOut = useCallback(() => {
    signOut({ redirectUrl: "/" });
  }, [signOut]);

  const resetTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(handleSignOut, INACTIVITY_TIMEOUT);
  }, [handleSignOut]);

  useEffect(() => {
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [resetTimer]);

  const currentLabel = NAV_ITEMS.find((n) => n.href === pathname)?.label ?? "CRM";

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-gray-100">
        <Link href="/" onClick={() => setSidebarOpen(false)}>
          <Image src="/logo.svg" alt="Apex Visuals" width={140} height={56} className="h-9 w-auto" />
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* Back to Dashboard */}
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-brand-navy hover:bg-gray-50 transition-all mb-3"
          onClick={() => setSidebarOpen(false)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">CRM</p>

        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive ? "bg-brand-navy text-white shadow-sm" : "text-gray-600 hover:bg-gray-50 hover:text-brand-navy"
              }`}
            >
              <span className={isActive ? "text-white" : "text-gray-400 group-hover:text-brand-navy"}>
                {item.icon}
              </span>
              {item.label}
              {isActive && <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-60" />}
            </Link>
          );
        })}
      </nav>

      <Separator />

      <div className="p-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 mb-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-brand-navy truncate">{displayName}</p>
            <p className="text-xs text-gray-400 truncate">{email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-brand-navy hover:bg-gray-100 transition-colors"
        >
          <LogOut className="h-4 w-4" />Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="hidden lg:flex w-60 flex-col bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>

      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">CRM</span>
                <span className="text-sm font-medium text-brand-navy">{currentLabel}</span>
              </div>
            </div>
            <button className="relative p-2 rounded-lg text-gray-400 hover:bg-gray-100">
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-brand-navy rounded-full" />
            </button>
          </div>
        </header>
        <main className="flex-1 px-4 sm:px-6 py-8">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
