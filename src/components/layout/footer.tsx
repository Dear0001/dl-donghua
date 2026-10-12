import { Camera, CodeXml, Send } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/[.06] bg-[#090d18]">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-7 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
        <div><Link href="/" className="font-display text-sm font-bold text-slate-200">ani<span className="text-violet-300">frame</span></Link><p className="mb-0 mt-1.5 text-[10px] text-slate-600">A fan-built discovery experience. Sample catalog data is illustrative.</p></div>
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-2 text-[10px] text-slate-500"><Link className="hover:text-slate-200" href="/anime">Browse</Link><Link className="hover:text-slate-200" href="/schedule">Schedule</Link><Link className="hover:text-slate-200" href="/watchlist">Watchlist</Link><Link className="hover:text-slate-200" href="/profile">Profile</Link></nav>
        <div className="flex gap-2"><SocialLink label="Instagram sample link"><Camera size={14} /></SocialLink><SocialLink label="Community link"><Send size={14} /></SocialLink><SocialLink label="Source code link"><CodeXml size={14} /></SocialLink></div>
      </div>
    </footer>
  );
}

function SocialLink({ label, children }: { label: string; children: React.ReactNode }) {
  return <span aria-label={label} className="grid size-8 place-items-center rounded-lg border border-white/[.07] text-slate-500">{children}</span>;
}
