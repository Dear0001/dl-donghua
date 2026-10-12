"use client";

import { Bookmark, CalendarDays, Clapperboard, Compass, Menu, Search, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useWatchStore } from "@/stores/watch-store";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home", icon: Compass },
  { href: "/anime", label: "Browse", icon: Clapperboard },
  { href: "/schedule", label: "Schedule", icon: CalendarDays },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const count = useWatchStore((state) => state.watchlist.length);

  const goSearch = () => {
    const term = search.trim();
    router.push(term ? `/search?q=${encodeURIComponent(term)}` : "/search");
    setSearch("");
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/[.06] bg-[#090d18]/90 backdrop-blur-2xl">
      <div className="mx-auto flex h-[68px] max-w-[1440px] items-center gap-7 px-4 sm:px-7 lg:px-10">
        <Link className="flex shrink-0 items-center gap-2.5" href="/">
          <span className="grid size-8 place-items-center rounded-[11px] bg-gradient-to-br from-violet-400 to-blue-400 text-slate-950 shadow-lg shadow-violet-500/15"><Clapperboard size={17} strokeWidth={2.5} /></span>
          <span className="font-display text-[17px] font-bold tracking-[-.6px]">ani<span className="text-violet-300">frame</span></span>
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-6 md:flex">
          {links.map(({ href, label }) => <Link className={cn("text-[12px] font-medium transition", pathname === href ? "text-white" : "text-slate-400 hover:text-white")} href={href} key={href}>{label}</Link>)}
          <Link className={cn("text-[12px] font-medium transition", pathname === "/genres/action" ? "text-white" : "text-slate-400 hover:text-white")} href="/genres/action">Genres</Link>
        </nav>
        <form className="relative ml-auto hidden w-full max-w-[290px] sm:block" onSubmit={(event) => { event.preventDefault(); goSearch(); }}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
          <input aria-label="Search anime" className="h-9 w-full rounded-xl border border-white/[.07] bg-white/[.035] pl-9 pr-3 text-xs text-white outline-none placeholder:text-slate-500 focus:border-violet-300/35 focus:bg-white/[.055]" onChange={(event) => setSearch(event.target.value)} placeholder="Search anime..." value={search} />
        </form>
        <Link aria-label={`Watchlist${count ? `, ${count} titles` : ""}`} className="relative hidden size-9 items-center justify-center rounded-xl border border-white/[.07] text-slate-300 transition hover:border-violet-300/20 hover:bg-white/[.05] hover:text-white sm:flex" href="/watchlist">
          <Bookmark size={16} />
          {count > 0 && <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-violet-400 text-[9px] font-bold text-slate-950">{count}</span>}
        </Link>
        <Link aria-label="Profile" className="hidden size-9 items-center justify-center rounded-full border border-violet-300/20 bg-violet-300/[.08] text-violet-100 transition hover:bg-violet-300/[.15] sm:flex" href="/profile"><UserRound size={16} /></Link>
        <button aria-expanded={menuOpen} aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} className="ml-auto grid size-9 place-items-center rounded-xl border border-white/[.07] text-slate-200 sm:ml-0 md:hidden" onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={18} /> : <Menu size={18} />}</button>
      </div>
      {menuOpen && <div className="border-t border-white/[.07] bg-[#0b1020] px-4 pb-4 pt-3 md:hidden">
        <form className="relative mb-3" onSubmit={(event) => { event.preventDefault(); goSearch(); }}><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} /><input aria-label="Search anime" className="h-10 w-full rounded-xl border border-white/[.08] bg-white/[.04] pl-9 pr-3 text-sm outline-none focus:border-violet-300/40" onChange={(event) => setSearch(event.target.value)} placeholder="Search anime..." value={search} /></form>
        <nav aria-label="Mobile navigation" className="grid grid-cols-2 gap-2">{[...links, { href: "/watchlist", label: "Watchlist", icon: Bookmark }, { href: "/profile", label: "Profile", icon: UserRound }].map(({ href, label, icon: Icon }) => <Link className="flex items-center gap-2 rounded-xl bg-white/[.035] px-3 py-2.5 text-xs text-slate-300" href={href} key={href} onClick={() => setMenuOpen(false)}><Icon size={14} />{label}{label === "Watchlist" && count > 0 ? ` (${count})` : ""}</Link>)}</nav>
      </div>}
    </header>
  );
}
