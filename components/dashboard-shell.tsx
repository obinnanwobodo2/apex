"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, CreditCard, Settings, LogOut,
  Bell, Menu, ChevronRight, User, Users,
  MessageCircle, FolderKanban, X, Search, FileText, Sparkles,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth, useUser, useClerk } from "@clerk/nextjs";
import { getPusherClient } from "@/lib/pusher-client";
import { getClientChannelName } from "@/lib/realtime";

const INACTIVITY_TIMEOUT = 15 * 60 * 1000;
const INACTIVITY_WARNING_MS = 60 * 1000;
const TOUR_STORAGE_KEY = "apex_dashboard_tour_completed";
const TOUR_SEEN_KEY = "apex_dashboard_tour_seen";
const LAST_LOGIN_STORAGE_KEY = "apex_last_login_at";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/projects", icon: FolderKanban, label: "My Project" },
  { href: "/dashboard/messages", icon: MessageCircle, label: "Messages" },
  { href: "/dashboard/files", icon: FileText, label: "Files" },
  { href: "/dashboard/billing", icon: CreditCard, label: "Billing" },
  { href: "/dashboard/support", icon: MessageCircle, label: "Support" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

const ADDON_ITEMS = [
  { href: "/crm", icon: Users, label: "CRM", badge: "PRO" },
];

const TOUR_STEPS = [
  {
    title: "Dashboard Overview",
    description: "Start here to see your project status, billing snapshot, and your new-client quick-start checklist.",
    href: "/dashboard",
  },
  {
    title: "My Project",
    description: "Track your project pipeline, review your website preview, and approve your build for launch.",
    href: "/dashboard/projects",
  },
  {
    title: "Messages",
    description: "Chat directly with the Apex Visual team about your project. All updates happen here.",
    href: "/dashboard/messages",
  },
  {
    title: "Billing & Cart",
    description: "View invoices, manage your subscription, and check out any items in your cart.",
    href: "/dashboard/billing",
  },
];

interface DashboardNotification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { userId } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const isGuestPreview = !user;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [timeoutWarningOpen, setTimeoutWarningOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(Math.floor(INACTIVITY_WARNING_MS / 1000));
  const [lastLogin, setLastLogin] = useState<string | null>(null);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const displayName = user?.fullName || user?.emailAddresses[0]?.emailAddress?.split("@")[0] || "Guest";
  const email = user?.emailAddresses[0]?.emailAddress || "Guest preview mode";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const avatarUrl = user?.imageUrl || "";

  const handleSignOut = useCallback(() => {
    if (isGuestPreview) {
      router.push("/login");
      return;
    }
    signOut({ redirectUrl: "/" });
  }, [isGuestPreview, router, signOut]);

  const resetTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    setTimeoutWarningOpen(false);
    setSecondsLeft(Math.floor(INACTIVITY_WARNING_MS / 1000));
    warningTimer.current = setTimeout(() => {
      setTimeoutWarningOpen(true);
      setSecondsLeft(Math.floor(INACTIVITY_WARNING_MS / 1000));
    }, INACTIVITY_TIMEOUT - INACTIVITY_WARNING_MS);
    inactivityTimer.current = setTimeout(handleSignOut, INACTIVITY_TIMEOUT);
  }, [handleSignOut]);

  useEffect(() => {
    if (isGuestPreview) return;
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      if (warningTimer.current) clearTimeout(warningTimer.current);
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    };
  }, [isGuestPreview, resetTimer]);

  useEffect(() => {
    if (!timeoutWarningOpen) return;
    countdownInterval.current = setInterval(() => {
      setSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => {
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    };
  }, [timeoutWarningOpen]);

  useEffect(() => {
    if (!user) return;
    try {
      const previous = localStorage.getItem(LAST_LOGIN_STORAGE_KEY);
      if (previous) setLastLogin(previous);
      localStorage.setItem(LAST_LOGIN_STORAGE_KEY, new Date().toISOString());
    } catch {
      // no-op when storage is unavailable
    }
  }, [user]);

  const continueSession = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Element;
      if (!t.closest("[data-notif]")) setNotifOpen(false);
      if (!t.closest("[data-profile]")) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!user) return;
    try {
      const completed = localStorage.getItem(TOUR_STORAGE_KEY) === "1";
      const seen = localStorage.getItem(TOUR_SEEN_KEY) === "1";
      if (!completed && !seen && pathname.startsWith("/dashboard")) {
        setTourOpen(true);
        localStorage.setItem(TOUR_SEEN_KEY, "1");
      }
    } catch {
      // no-op in private/blocked storage contexts
    }
  }, [user, pathname]);

  const loadNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setNotificationsLoading(true);
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      const data = await res.json().catch(() => []);
      if (!res.ok) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      const rows = Array.isArray(data) ? (data as DashboardNotification[]) : [];
      setNotifications(rows);
      setUnreadCount(rows.filter((item) => !item.read).length);
    } finally {
      setNotificationsLoading(false);
    }
  }, [userId]);

  const markNotificationsRead = useCallback(async () => {
    if (!userId) return;
    if (notifications.every((item) => item.read)) {
      setUnreadCount(0);
      return;
    }
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
  }, [notifications, userId]);

  useEffect(() => {
    if (!userId) return;
    void loadNotifications();
  }, [loadNotifications, userId]);

  useEffect(() => {
    if (!userId) return;
    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe(getClientChannelName(userId));
    const onNotification = (payload: DashboardNotification) => {
      if (!payload?.id) return;
      setNotifications((prev) => {
        if (prev.some((item) => item.id === payload.id)) return prev;
        return [payload, ...prev].slice(0, 50);
      });
      setUnreadCount((count) => count + (payload.read ? 0 : 1));
    };
    channel.bind("new-notification", onNotification);

    return () => {
      channel.unbind("new-notification", onNotification);
      pusher.unsubscribe(getClientChannelName(userId));
    };
  }, [userId]);

  function closeTour(markCompleted: boolean) {
    setTourOpen(false);
    if (!markCompleted) return;
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, "1");
    } catch {
      // no-op
    }
  }

  function nextTourStep() {
    if (tourStep >= TOUR_STEPS.length - 1) {
      closeTour(true);
      return;
    }
    setTourStep((s) => s + 1);
  }

  function prevTourStep() {
    if (tourStep === 0) return;
    setTourStep((s) => s - 1);
  }

  function goToStepPage() {
    const step = TOUR_STEPS[tourStep];
    if (!step) return;
    router.push(step.href);
  }

  const activeLabel = NAV_ITEMS.find((n) => n.href === pathname)?.label
    ?? ADDON_ITEMS.find((n) => pathname.startsWith(n.href))?.label
    ?? "Dashboard";

  const NavLink = ({ item, onClick }: { item: typeof NAV_ITEMS[0]; onClick?: () => void }) => {
    const Icon = item.icon;
    const isActive = pathname === item.href;
    return (
      <Link href={item.href} onClick={onClick}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
          isActive ? "bg-brand-green/10 text-brand-green border border-brand-green/30" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}>
        <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-brand-green" : "text-gray-400"}`} />
        {item.label}
        {isActive && <ChevronRight className="h-3 w-3 ml-auto text-brand-green/60" />}
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-4 border-b border-gray-200">
        <Link href="/" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2.5">
          <Image src="/logo.svg" alt="Apex Visual" width={126} height={50} className="h-8 w-auto" />
        </Link>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">Portal</p>
        {NAV_ITEMS.map((item) => <NavLink key={item.href} item={item} onClick={() => setSidebarOpen(false)} />)}

        <div className="pt-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">Add-ons</p>
          {ADDON_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive ? "bg-brand-green/10 text-brand-green border border-brand-green/30" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}>
                <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-brand-green" : "text-gray-400"}`} />
                {item.label}
                {item.badge && <span className="ml-auto text-[9px] bg-brand-green/15 text-brand-green px-1.5 py-0.5 rounded font-bold">{item.badge}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-gray-200 p-3">
        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-100">
          <Avatar className="h-7 w-7 flex-shrink-0">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="bg-brand-green/20 text-brand-green text-[10px] font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-900 truncate">{displayName}</p>
            <p className="text-[10px] text-gray-400 truncate">{email}</p>
          </div>
        </div>
        {isGuestPreview ? (
          <button
            onClick={() => router.push("/login")}
            className="w-full mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-brand-navy hover:bg-gray-100 transition-colors"
          >
            <User className="h-3.5 w-3.5" />Sign in to manage account
          </button>
        ) : (
          <button onClick={handleSignOut}
            className="w-full mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-brand-navy hover:bg-gray-100 transition-colors">
            <LogOut className="h-3.5 w-3.5" />Sign out
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="hidden lg:flex w-52 flex-col bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-gray-50/80 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 w-52 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 p-1 rounded text-gray-500 hover:text-gray-900">
          <X className="h-4 w-4" />
        </button>
        <SidebarContent />
      </aside>

      <div className="flex-1 lg:ml-52 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20" style={{ height: "52px" }}>
          <div className="px-4 sm:px-6 h-full flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-4 w-4" />
              </button>
              <span className="truncate text-sm font-semibold text-gray-900">{activeLabel}</span>
            </div>

            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
              <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                <Search className="h-4 w-4" />
              </button>

              <div className="relative" data-notif>
                <button
                  onClick={() => {
                    const nextOpen = !notifOpen;
                    setNotifOpen(nextOpen);
                    setProfileOpen(false);
                    if (nextOpen) void markNotificationsRead();
                  }}
                  className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-brand-green text-[10px] leading-4 text-white text-center">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-2xl z-50">
                    <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">Notifications</span>
                      <span className="text-[10px] text-brand-green">{unreadCount} new</span>
                    </div>
                    <div className="p-2 space-y-2 max-h-72 overflow-y-auto">
                      {notificationsLoading ? (
                        <p className="text-xs text-gray-400 px-2 py-2">Loading notifications...</p>
                      ) : notifications.length === 0 ? (
                        <p className="text-xs text-gray-400 px-2 py-2">No notifications yet.</p>
                      ) : (
                        notifications.slice(0, 8).map((item) => (
                          <div
                            key={item.id}
                            className={`flex gap-3 p-2.5 rounded-lg border ${
                              item.read ? "bg-white border-gray-100" : "bg-brand-green/5 border-brand-green/20"
                            }`}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${item.read ? "bg-gray-300" : "bg-brand-green"}`} />
                            <div>
                              <p className="text-sm text-gray-900 font-medium capitalize">{item.type.replace("_", " ")}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{item.message}</p>
                              <p className="text-[10px] text-gray-400 mt-1">
                                {new Date(item.createdAt).toLocaleString("en-ZA", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="px-4 py-2.5 border-t border-gray-200">
                      <button className="text-xs text-brand-green hover:underline" onClick={() => void loadNotifications()}>Refresh</button>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative" data-profile>
                <button onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                  className="flex items-center gap-2 px-1.5 py-1.5 sm:pl-2 sm:pr-2.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="bg-brand-green/20 text-brand-green text-[9px] font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm text-gray-900 font-medium max-w-[90px] truncate">{displayName}</span>
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-2xl z-50">
                    <div className="px-3 py-3 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                      <p className="text-xs text-gray-500 truncate">{email}</p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Last login: {lastLogin ? new Date(lastLogin).toLocaleString("en-ZA") : "First login"}
                      </p>
                    </div>
                    <div className="p-1.5">
                      <Link href="/dashboard/settings" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                        <User className="h-3.5 w-3.5" />Settings
                      </Link>
                      {isGuestPreview ? (
                        <button
                          onClick={() => router.push("/login")}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-brand-navy hover:bg-gray-100 transition-colors"
                        >
                          <User className="h-3.5 w-3.5" />Sign in
                        </button>
                      ) : (
                        <button onClick={handleSignOut}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-brand-navy hover:bg-gray-100 transition-colors">
                          <LogOut className="h-3.5 w-3.5" />Sign out
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 py-8">
          <div className="max-w-5xl mx-auto">{children}</div>
        </main>
      </div>

      {tourOpen && (
        <div className="fixed inset-0 z-[70] bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-brand-green/10 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-brand-green" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-navy">New Client Tour</p>
                  <p className="text-xs text-gray-500">
                    Step {tourStep + 1} of {TOUR_STEPS.length}
                  </p>
                </div>
              </div>
              <button
                onClick={() => closeTour(true)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-brand-navy hover:bg-gray-100"
                aria-label="Close tour"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5">
              <h3 className="text-lg font-bold text-brand-navy">{TOUR_STEPS[tourStep]?.title}</h3>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{TOUR_STEPS[tourStep]?.description}</p>
            </div>

            <div className="mt-5 h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full bg-brand-green transition-all"
                style={{ width: `${((tourStep + 1) / TOUR_STEPS.length) * 100}%` }}
              />
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                onClick={() => closeTour(true)}
                className="text-xs font-semibold text-gray-500 hover:text-brand-navy transition-colors"
              >
                Skip tour
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={prevTourStep}
                  disabled={tourStep === 0}
                  className="px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:text-brand-navy hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Back
                </button>
                <button
                  onClick={goToStepPage}
                  className="px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:text-brand-navy hover:border-gray-300"
                >
                  Open page
                </button>
                <button
                  onClick={nextTourStep}
                  className="px-3 py-2 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-[#1b2340] to-[#2dc5a2] hover:opacity-90"
                >
                  {tourStep === TOUR_STEPS.length - 1 ? "Finish" : "Next"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {timeoutWarningOpen && (
        <div className="fixed inset-0 z-[80] bg-gray-900/35 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl">
            <h3 className="text-base font-bold text-brand-navy">Session timeout warning</h3>
            <p className="text-sm text-gray-500 mt-2">
              You will be signed out in {secondsLeft}s due to inactivity.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={handleSignOut}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:text-brand-navy hover:border-gray-300"
              >
                Sign out
              </button>
              <button
                onClick={continueSession}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#1b2340] to-[#2dc5a2] hover:opacity-90"
              >
                Stay signed in
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
