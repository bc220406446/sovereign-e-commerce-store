"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import {
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { STORE_NAME } from "@/lib/store";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const CARE_LINKS = [
  { label: "Track My Order", href: "/track" },
  { label: "FAQs", href: "/care/faqs" },
  { label: "Returns & Exchange", href: "/care/returns" },
  { label: "Warranty Information", href: "/care/warranty" },
  { label: "Shipping Policy", href: "/care/shipping" },
  { label: "Modes of Payment", href: "/care/payment" },
  { label: "Privacy Policy", href: "/care/privacy" },
  { label: "Terms of Service", href: "/care/terms" },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <img
        src="/sovereign-logo.png"
        alt={`${STORE_NAME} logo`}
        className="size-11 object-contain"
      />
      <span className="font-display text-2xl font-semibold tracking-wide text-slate-800">Sovereign</span>
    </Link>
  );
}

export function Header() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { count, openCart } = useCart();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/shop?q=${encodeURIComponent(query)}`);
    setQuery("");
    setSearchOpen(false);
    setMobileOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const initials = (profile?.name || user?.email || "U")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="glass-nav sticky top-0 z-40">
      {/* announcement bar */}
      <div className="banner-gradient overflow-hidden px-4 py-1.5 text-xs font-medium text-white">
        <div className="announcement-track flex w-max gap-[80px] whitespace-nowrap">
          Complimentary delivery on orders over Rs. 10,000 &nbsp;·&nbsp;           12-month warranty on every Sovereign &nbsp;·&nbsp; Cash on Delivery
          available
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* mobile menu button */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="glass-strong w-80">
            <SheetHeader className="pb-4 text-left">
              <SheetTitle>
                <Logo />
              </SheetTitle>
            </SheetHeader>
            <div className="space-y-6 pt-4">
              <form onSubmit={submitSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search watches..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="glass-soft w-full rounded-full py-2 pl-9 pr-4 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-primary/40"
                />
                <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
              </form>

              <nav className="space-y-1">
                {NAV_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg px-3 py-2 text-base font-medium text-slate-700 hover:bg-primary/10 hover:text-primary"
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>

              <div className="border-t border-white/60 pt-4">
                <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Customer Care
                </p>
                <div className="mt-2 space-y-1">
                  {CARE_LINKS.map((c) => (
                    <Link
                      key={c.href}
                      href={c.href}
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:text-primary"
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* logo */}
        <Logo />

        {/* desktop nav */}
        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-primary"
            >
              {l.label}
            </Link>
          ))}

          {/* care dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-slate-600 transition-colors hover:text-primary">
              Care <ChevronDown className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="glass-strong w-48">
              {CARE_LINKS.map((c) => (
                <DropdownMenuItem key={c.href} asChild>
                  <Link href={c.href}>{c.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* actions */}
        <div className="flex items-center gap-2">
          {/* search toggle desktop */}
          {searchOpen ? (
            <form onSubmit={submitSearch} className="relative hidden sm:block">
              <input
                type="text"
                autoFocus
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="glass-soft w-48 rounded-full py-1.5 pl-8 pr-7 text-xs text-slate-800 outline-none focus:w-64 focus:ring-2 focus:ring-primary/40 transition-all"
              />
              <Search className="absolute left-2.5 top-2 size-3.5 text-slate-400" />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="size-3.5" />
              </button>
            </form>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="hidden rounded-full sm:flex"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <Search className="size-4" />
            </Button>
          )}

          {/* wishlist */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            asChild
            aria-label="Wishlist"
          >
            <Link href={user ? "/account?tab=wishlist" : "/auth?returnTo=/account"}>
              <Heart className="size-4" />
            </Link>
          </Button>

          {/* cart */}
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full"
            onClick={openCart}
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="size-4" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-sm">
                {count}
              </span>
            )}
          </Button>

          {/* user profile */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="size-8 ring-1 ring-primary/30">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-strong w-52">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profile?.name || "Account"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={isAdmin ? "/admin" : "/account"}>
                    {isAdmin ? (
                      <LayoutDashboard className="mr-2 size-4" />
                    ) : (
                      <User className="mr-2 size-4" />
                    )}
                    {isAdmin ? "Admin Panel" : "My Account"}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 size-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="glass-chip hidden rounded-full border-0 sm:flex"
              asChild
            >
              <Link href="/auth">
                <LogIn className="mr-1.5 size-3.5" /> Sign In
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
