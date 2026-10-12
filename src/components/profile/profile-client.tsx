"use client";

import { Check, MonitorPlay, Moon, Settings2, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { mockAnime } from "@/data/mock-anime";
import { useWatchStore } from "@/stores/watch-store";
import { toast } from "sonner";
import type { AnimeSummary } from "@/types/anime";

export function ProfileClient() {
  const watchlist = useWatchStore((state) => state.watchlist);
  const progress = useWatchStore((state) => state.progress);
  const [displayName, setDisplayName] = useState("Anime fan");
  const [saved, setSaved] = useState(false);
  const [autoNext, setAutoNext] = useState(false);
  const [resume, setResume] = useState(true);
  useEffect(() => {
    try {
      setDisplayName(window.localStorage.getItem("anime-profile-name") || "Anime fan");
      setAutoNext(window.localStorage.getItem("anime-auto-next") === "true");
      setResume(window.localStorage.getItem("anime-resume") !== "false");
    } catch { /* Profile preferences are optional. */ }
  }, []);
  const completed = watchlist.filter((item) => item.status === "COMPLETED").length;
  const watching = watchlist.filter((item) => item.status === "WATCHING").length;
  const watchedAnime = [...new Set(progress.map((item) => item.animeId))].map((id) =>
    progress.find((item) => item.animeId === id)?.anime ?? mockAnime.find((anime) => anime.id === id),
  ).filter((anime): anime is AnimeSummary => anime !== undefined);
  const saveName = () => {
    try {
      window.localStorage.setItem("anime-profile-name", displayName.trim() || "Anime fan");
    } catch {
      toast.error("Profile name could not be saved on this device.");
      return;
    }
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };
  const updatePreference = (key: string, value: boolean, update: (value: boolean) => void) => {
    update(value);
    try {
      window.localStorage.setItem(key, String(value));
    } catch {
      toast.error("Preference could not be saved on this device.");
    }
  };

  return <div className="mx-auto max-w-[1080px] px-4 pb-16 pt-10 sm:px-7"><p className="eyebrow"><UserRound size={12} /> LOCAL PROFILE</p><h1 className="font-display text-3xl font-bold text-white sm:text-4xl">Your space<span className="text-violet-300">.</span></h1><p className="mt-2 text-sm text-slate-400">Profile settings are stored on this device. Sign-in is not configured.</p>
    <section className="mt-7 flex flex-col gap-5 rounded-2xl border border-white/[.07] bg-white/[.025] p-5 sm:flex-row sm:items-center sm:p-6"><span className="grid size-16 shrink-0 place-items-center rounded-2xl border border-violet-300/15 bg-gradient-to-br from-violet-300/15 to-blue-300/10 text-violet-100"><UserRound size={27} /></span><div className="flex-1"><label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-slate-400" htmlFor="profile-name">Display name</label><div className="flex gap-2"><input className="h-10 w-full max-w-sm rounded-xl border border-white/[.08] bg-black/20 px-3 text-sm text-white outline-none focus:border-violet-300/35" id="profile-name" maxLength={40} onChange={(event) => setDisplayName(event.target.value)} value={displayName} /><button className="flex h-10 items-center gap-1.5 rounded-xl bg-violet-300 px-3 text-[10px] font-bold text-slate-950 hover:bg-violet-200" onClick={saveName}>{saved ? <Check size={13} /> : null}{saved ? "Saved" : "Save"}</button></div></div></section>
    <div className="mt-4 grid grid-cols-3 gap-2"><Stat label="On your list" value={watchlist.length} /><Stat label="Watching" value={watching} /><Stat label="Completed" value={completed} /></div>
    <section className="mt-7 rounded-2xl border border-white/[.06] bg-white/[.02] p-5"><h2 className="flex items-center gap-2 font-display text-sm font-bold text-white"><Settings2 size={15} className="text-violet-200" /> Playback preferences</h2><Preference icon={<MonitorPlay size={15} />} label="Auto-play next episode" checked={autoNext} onChange={(checked) => updatePreference("anime-auto-next", checked, setAutoNext)} /><Preference icon={<Moon size={15} />} label="Resume from last position" checked={resume} onChange={(checked) => updatePreference("anime-resume", checked, setResume)} /><p className="mt-3 text-[10px] text-slate-600">Theme is currently dark. Playback options take effect when an authorized stream is available.</p></section>
    <section className="mt-7"><div className="mb-3"><p className="eyebrow">YOUR RECENTLY WATCHED TITLES</p><h2 className="section-title">Watching history</h2></div>{watchedAnime.length ? <div className="space-y-2">{watchedAnime.map((anime) => <Link className="flex items-center gap-3 rounded-xl border border-white/[.06] bg-white/[.02] p-3 text-xs text-slate-200 hover:bg-white/[.05]" href={`/anime/${anime.slug}`} key={anime.id}>{anime.title}<span className="ml-auto text-[10px] text-slate-500">{progress.filter((item) => item.animeId === anime.id).length} episodes started</span></Link>)}</div> : <p className="rounded-xl border border-white/[.06] p-5 text-xs text-slate-500">Playback history appears here after you watch an authorized video.</p>}</section>
  </div>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-white/[.06] bg-white/[.025] p-4"><p className="m-0 font-display text-xl font-bold text-white">{value}</p><p className="m-0 mt-1 text-[9px] text-slate-500 sm:text-[10px]">{label}</p></div>;
}

function Preference({ icon, label, checked, onChange }: { icon: React.ReactNode; label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex cursor-pointer items-center gap-3 border-b border-white/[.05] py-3 last:border-0 last:pb-0"><span className="text-slate-400">{icon}</span><span className="flex-1 text-xs text-slate-300">{label}</span><input checked={checked} className="size-4 accent-violet-400" onChange={(event) => onChange(event.target.checked)} type="checkbox" /></label>;
}
