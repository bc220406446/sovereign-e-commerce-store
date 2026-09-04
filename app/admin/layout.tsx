"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowLeft,
  LayoutDashboard,
  LogOut,
  Package,
  Percent,
  Settings,
  Shield,
  ShieldAlert,
  ShoppingCart,
  Star,
  Store,
  Users,
  Menu,
  X,
  Mail,
  Send,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { STORE_NAME } from "@/lib/store";
import { ReactNode } from "react";
import { useState } from "react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Store },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/coupons", label: "Coupons", icon: Percent },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/messages", label: "Messages", icon: Mail },
  { href: "/admin/newsletter", label: "Newsletter", icon: Send },
  { href: "/admin/team", label: "Team & Invites", icon: Shield },
  { href: "/admin/settings", label: "Delivery & Payments", icon: Settings },
];

export function AdminHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-900 sm:text-3xl">
          {title}
        </h1>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, profile, isAdmin, isLoading, signOut } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-slate-300 border-t-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <ShieldAlert className="size-10 text-slate-300" />
        <h1 className="font-display text-2xl font-semibold text-slate-900">
          Store owner access
        </h1>
        <p className="text-sm text-slate-500">
          Sign in to manage {STORE_NAME}. You must have an administrator role to access this portal.
        </p>
        <Button className="rounded-full" asChild>
          <Link href={`/auth?returnTo=${encodeURIComponent("/admin")}`}>
            Sign in to continue
          </Link>
        </Button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <ShieldAlert className="size-10 text-rose-400" />
        <h1 className="font-display text-2xl font-semibold text-slate-900">
          Access Restricted
        </h1>
        <p className="text-sm text-slate-500">
          You are signed in as <strong>{user.email}</strong>, which does not have administrative permissions.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-full" asChild>
            <Link href="/">Back to store</Link>
          </Button>
          <Button className="rounded-full" onClick={() => window.confirm("Are you sure you want to sign out?") && signOut()}>
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  const initials = (profile?.name || user.email || "A").slice(0, 2).toUpperCase();
  const confirmSignOut = () => {
    if (window.confirm("Are you sure you want to sign out of the Admin Panel?")) signOut();
  };

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      {/* SIDEBAR */}
      <aside className="glass fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200/80 bg-white/70 p-4 backdrop-blur-xl lg:flex">
        <div className="mb-6 flex items-center justify-between px-2 pt-2">
          <Link href="/admin" className="flex items-center gap-3 px-2 font-display text-lg font-bold text-slate-900">
            <img src="/sovereign-logo.png" alt={`${STORE_NAME} logo`} className="size-10 object-contain" />
            <span className="whitespace-nowrap text-sm tracking-wide text-slate-700">Admin Panel</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-colors",
                  active
                    ? "bg-primary text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                )}
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200/60 pt-4 space-y-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-primary transition-colors px-2"
          >
            <ArrowLeft className="size-3.5" /> Back to Storefront
          </Link>

          <div className="flex items-center justify-between px-2 pt-1">
            <div className="flex items-center gap-2">
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary/10 text-xs text-primary font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div className="text-left leading-tight">
                <p className="text-xs font-medium text-slate-800 truncate max-w-[110px]">{profile?.name || "Admin"}</p>
                <p className="text-[10px] text-slate-400">Store Owner</p>
              </div>
            </div>
            <button onClick={confirmSignOut} className="text-slate-400 hover:text-rose-500 cursor-pointer" aria-label="Sign out">
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Mobile top header */}
        <header className="glass sticky top-0 z-20 flex items-center gap-3 p-4 lg:hidden">
          <button type="button" aria-label="Open admin menu" onClick={() => setMobileMenuOpen(true)} className="rounded-full p-2 text-slate-600 hover:bg-white/60">
            <Menu className="size-5" />
          </button>
          <Link href="/admin" className="flex items-center gap-2">
            <img src="/sovereign-logo.png" alt={`${STORE_NAME} logo`} className="size-10 object-contain" />
            <span className="whitespace-nowrap text-sm font-semibold text-slate-700">Admin Panel</span>
          </Link>
          <div className="ml-auto w-2" />
        </header>

        {mobileMenuOpen && <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label="Close admin menu" className="absolute inset-0 bg-slate-900/20" onClick={() => setMobileMenuOpen(false)} />
          <aside className="glass-strong relative flex h-full w-72 flex-col p-5 shadow-2xl">
            <div className="mb-6 flex items-center justify-between"><div className="flex items-center gap-3"><img src="/sovereign-logo.png" alt={`${STORE_NAME} logo`} className="size-10 object-contain" /><span className="text-sm font-semibold text-slate-700">Admin Panel</span></div><button aria-label="Close admin menu" onClick={() => setMobileMenuOpen(false)}><X className="size-5 text-slate-500" /></button></div>
            <nav className="flex-1 space-y-1">{NAV.map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} className={cn("flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium", pathname === item.href ? "bg-primary text-white" : "text-slate-600 hover:bg-white/60")}><Icon className="size-5" />{item.label}</Link>; })}</nav>
            <div className="mt-5 space-y-2 border-t border-slate-200/70 pt-4"><Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600"><ArrowLeft className="size-4" /> Storefront</Link><button type="button" onClick={confirmSignOut} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50"><LogOut className="size-4" /> Sign out</button></div>
          </aside>
        </div>}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
