import { Compass } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return <div className="mx-auto flex min-h-[60vh] max-w-[650px] flex-col items-center justify-center px-5 text-center"><span className="grid size-14 place-items-center rounded-2xl border border-violet-300/15 bg-violet-300/[.06] text-violet-200"><Compass size={23} /></span><p className="eyebrow mt-5">LOST IN THE LIBRARY</p><h1 className="font-display text-3xl font-bold text-white">This page is off the map.</h1><p className="mt-2 text-sm leading-6 text-slate-400">The anime or episode may have moved, or this address may not exist.</p><Link className="mt-5 rounded-xl bg-violet-300 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-violet-200" href="/">Back to AniFrame</Link></div>;
}
