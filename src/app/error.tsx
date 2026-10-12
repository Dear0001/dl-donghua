"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("AniFrame page failed:", error);
    toast.error("This page could not be loaded.");
  }, [error]);
  return <div className="mx-auto flex min-h-[55vh] max-w-[600px] flex-col items-center justify-center px-5 text-center" role="alert"><p className="eyebrow">A TEMPORARY INTERRUPTION</p><h1 className="font-display text-2xl font-bold text-white">This page hit a snag.</h1><p className="mt-2 text-sm leading-6 text-slate-400">Check your connection, then try loading the page again.</p><button className="mt-5 rounded-xl bg-violet-300 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-violet-200" onClick={() => reset()}>Try again</button></div>;
}
