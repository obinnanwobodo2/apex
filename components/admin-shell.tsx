"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, FolderKanban, CreditCard,
  LogOut, Menu, ChevronRight, Shield, LifeBuoy, FileImage, MessageCircle, Globe,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useUser, useClerk } from "@clerk/nextjs";

const NAV_ITEMS = [
  { href: "/admin", icon: <LayoutDashboard className="h-4 w-4" />, label: "Overview" },
  { href: "/admin/clients", icon: <Users className="h-4 w-4" />, label: "Clients" },
  { href: "/admin/projects", icon: <FolderKanban className="h-4 w-4" />, label: "Projects" },
  { href: "/admin/messages", icon: <MessageCircle className="h-4 w-4" />, label: "Messages" },
  { href: "/admin/files", icon: <FileImage className="h-4 w-4" />, label: "Files" },
  { href: "/admin/domains", icon: <Globe className="h-4 w-4" />, label: "Domains" },
  { href: "/admin/billing", icon: <CreditCard className="h-4 w-4" />, label: "Revenue" },
  { href: "/admin/support", icon: <LifeBuoy className="h-4 w-4" />, label: "Support" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const displayName = user?.fullName || user?.emailAddresses[0]?.emailAddress?.split("@")[0] || "Admin";

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-gray-100">
        <Link href="/">
          <Image src="/logo.svg" alt="Apex Visual" width={140} height={56} className="h-9 w-auto" />
        </Link>
        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-brand-green/10 border border-brand-green/30 text-brand-green text-xs font-semibold">
          <Shield className="h-3 w-3" />Admin Panel
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive ? "bg-brand-navy text-white shadow-sm" : "text-gray-600 hover:bg-gray-50 hover:text-brand-navy"
              }`}>
              <span className={isActive ? "text-white" : "text-gray-400 group-hover:text-brand-green"}>{item.icon}</span>
              {item.label}
              {isActive && <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-60" />}
            </Link>
          );
        })}

      </nav>

      <Separator />

      <div className="p-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-green/10 mb-3">
          <div className="w-9 h-9 rounded-full bg-brand-green/20 flex items-center justify-center text-brand-navy font-bold text-sm">
            {displayName[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-navy">{displayName}</p>
            <p className="text-xs text-brand-green font-medium">Administrator</p>
          </div>
        </div>
        <button onClick={() => signOut({ redirectUrl: "/" })}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-brand-green hover:bg-brand-green/10 transition-colors">
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
        <div className="fixed inset-0 z-40 bg-gray-900/20 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <SidebarContent />
      </aside>
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="px-4 sm:px-6 h-14 flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-full">ADMIN</span>
              <span className="text-sm font-medium text-brand-navy">
                {NAV_ITEMS.find((n) => n.href === pathname)?.label ?? "Admin Panel"}
              </span>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 sm:px-6 py-8">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
