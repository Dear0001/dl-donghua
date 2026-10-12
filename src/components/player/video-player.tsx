"use client";

import Hls from "hls.js";
import { AlertCircle, ArrowLeft, ArrowRight, Maximize, Minimize, Pause, Play, Settings2, Volume2, VolumeX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Anime, Episode } from "@/types/anime";
import { playbackProgress } from "@/services/playback-progress";

export function VideoPlayer({ anime, episode, previous, next }: { anime: Anime; episode: Episode; previous?: Episode; next?: Episode }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [theater, setTheater] = useState(false);
  const [autoNext, setAutoNext] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const source = episode.videoSources.find((item) => item.authorized === true && ["video/mp4", "application/x-mpegURL"].includes(item.type));

  const save = useCallback((video: HTMLVideoElement) => {
    if (!Number.isFinite(video.currentTime) || !Number.isFinite(video.duration) || video.duration <= 0) return;
    playbackProgress.save({
      animeId: anime.id,
      anime,
      episodeId: episode.id,
      episodeNumber: episode.episodeNumber,
      currentTime: video.currentTime,
      duration: video.duration,
      lastWatchedAt: new Date().toISOString(),
      completed: video.currentTime / video.duration >= 0.9,
    });
  }, [anime, episode.episodeNumber, episode.id]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !source) return;
    setFailed(false);
    setReady(false);
    const saved = playbackProgress.forEpisode(episode.id);
    const setResume = () => {
      let resumeEnabled = true;
      try {
        resumeEnabled = window.localStorage.getItem("anime-resume") !== "false";
      } catch {
        console.warn("[player] Unable to read playback preferences; resume is enabled for this session.");
      }
      if (resumeEnabled && saved && saved.currentTime > 0 && saved.currentTime < video.duration - 10) video.currentTime = saved.currentTime;
      setDuration(Number.isFinite(video.duration) ? video.duration : 0);
      setReady(true);
    };
    if (source.type === "application/x-mpegURL" && !video.canPlayType("application/vnd.apple.mpegurl")) {
      if (!Hls.isSupported()) {
        setFailed(true);
        return;
      }
      const hls = new Hls({ enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(source.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, setResume);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) setFailed(true);
      });
    } else {
      video.src = source.url;
      video.addEventListener("loadedmetadata", setResume, { once: true });
      video.addEventListener("error", () => setFailed(true), { once: true });
    }
    const interval = window.setInterval(() => save(video), 5000);
    return () => {
      window.clearInterval(interval);
      hlsRef.current?.destroy();
      hlsRef.current = null;
      video.removeAttribute("src");
      video.load();
    };
  }, [episode.id, save, source]);

  useEffect(() => {
    try {
      setAutoNext(window.localStorage.getItem("anime-auto-next") === "true");
    } catch {
      console.warn("[player] Unable to read auto-next preference.");
      setAutoNext(false);
    }
  }, []);

  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) await video.play().catch(() => setFailed(true));
    else video.pause();
  };

  const toggleFullscreen = async () => {
    const container = videoRef.current?.parentElement;
    if (!container) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await container.requestFullscreen();
  };

  if (!source) {
    return <div className={`player-shell ${theater ? "player-theater" : ""}`}>
      <div className="player-unavailable"><span className="grid size-14 place-items-center rounded-2xl border border-violet-300/15 bg-violet-300/[.06] text-violet-200"><AlertCircle size={24} /></span><h2>Episode currently unavailable</h2><p>This catalog entry has no authorized video source. Add a video you own or have permission to stream to enable playback.</p></div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[.06] bg-[#0b1120] px-4 py-3"><span className="text-xs text-slate-400">{anime.title} · {episode.title}</span><button className="player-toggle" onClick={() => setTheater((value) => !value)}>{theater ? <Minimize size={14} /> : <Maximize size={14} />} Theater mode</button></div>
    </div>;
  }

  return (
    <div className={`player-shell ${theater ? "player-theater" : ""}`}>
      <div className="video-stage">
        {!ready && !failed && <div className="absolute inset-0 z-10 grid place-items-center bg-[#05070d]"><span className="size-7 animate-spin rounded-full border-2 border-violet-200/20 border-t-violet-200" /></div>}
        {failed && <div className="absolute inset-0 z-20 grid place-items-center bg-[#05070d] p-6 text-center"><div><AlertCircle className="mx-auto text-rose-300" size={25} /><p className="mt-3 text-sm font-semibold text-white">Stream unavailable</p><p className="mt-1 text-xs text-slate-400">The authorized video source could not be loaded.</p></div></div>}
        <video
          className="video-element"
          onClick={togglePlayback}
          onDurationChange={(event) => setDuration(event.currentTarget.duration)}
          onEnded={(event) => { save(event.currentTarget); if (autoNext && next) router.push(`/watch/${anime.slug}/${next.episodeNumber}`); }}
          onPause={(event) => { setPlaying(false); save(event.currentTarget); }}
          onPlay={() => setPlaying(true)}
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
          playsInline
          poster={episode.thumbnail ?? anime.bannerImage}
          ref={videoRef}
        >
          {episode.subtitles.map((subtitle) => <track default={subtitle.default} kind="subtitles" label={subtitle.label} key={`${subtitle.lang}-${subtitle.src}`} src={subtitle.src} srcLang={subtitle.lang} />)}
        </video>
      </div>
      <div className="player-controls">
        <div className="flex items-center gap-2.5">
          <button aria-label={playing ? "Pause video" : "Play video"} className="player-control-main" onClick={togglePlayback}>{playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}</button>
          <button aria-label={muted ? "Unmute video" : "Mute video"} className="player-control" onClick={() => { if (videoRef.current) videoRef.current.muted = !muted; setMuted(!muted); }}>{muted ? <VolumeX size={15} /> : <Volume2 size={15} />}</button>
          <span className="text-[10px] tabular-nums text-slate-400">{formatTime(currentTime)} / {formatTime(duration)}</span>
        </div>
        <input aria-label="Video playback position" className="player-progress" max={duration || 100} min={0} onChange={(event) => { const time = Number(event.target.value); if (videoRef.current) videoRef.current.currentTime = time; setCurrentTime(time); }} style={{ "--progress": `${duration ? (currentTime / duration) * 100 : 0}%` } as React.CSSProperties} type="range" value={duration ? currentTime : 0} />
        <div className="flex items-center gap-1.5">
          <input aria-label="Video volume" className="player-volume" max={1} min={0} onChange={(event) => { const value = Number(event.target.value); if (videoRef.current) videoRef.current.volume = value; setVolume(value); setMuted(value === 0); }} step={0.05} type="range" value={muted ? 0 : volume} />
          <button aria-label="Settings" className="player-control" onClick={() => document.getElementById("subtitle-track-select")?.focus()}><Settings2 size={15} /></button>
          <select aria-label="Subtitle language" className="player-subtitle-select" id="subtitle-track-select" defaultValue="" onChange={(event) => { const video = videoRef.current; if (!video) return; Array.from(video.textTracks).forEach((track) => { track.mode = "disabled"; }); const selected = episode.subtitles.findIndex((subtitle) => subtitle.src === event.target.value); if (selected >= 0 && video.textTracks[selected]) video.textTracks[selected].mode = "showing"; }}><option value="">Subtitles</option>{episode.subtitles.map((subtitle) => <option key={subtitle.src} value={subtitle.src}>{subtitle.label}</option>)}</select>
          <button aria-pressed={autoNext} className={`autonext-button ${autoNext ? "autonext-on" : ""}`} onClick={() => { const nextValue = !autoNext; setAutoNext(nextValue); try { window.localStorage.setItem("anime-auto-next", String(nextValue)); } catch { /* Optional local preference. */ } }}>Auto next</button>
          {previous && <button aria-label="Previous episode" className="player-control" onClick={() => router.push(`/watch/${anime.slug}/${previous.episodeNumber}`)}><ArrowLeft size={15} /></button>}
          {next && <button aria-label="Next episode" className="player-control" onClick={() => router.push(`/watch/${anime.slug}/${next.episodeNumber}`)}><ArrowRight size={15} /></button>}
          <button aria-label={theater ? "Exit theater mode" : "Theater mode"} className="player-control" onClick={() => setTheater(!theater)}>{theater ? <Minimize size={15} /> : <Maximize size={15} />}</button>
          <button aria-label="Toggle fullscreen" className="player-control" onClick={toggleFullscreen}><Maximize size={15} /></button>
        </div>
      </div>
      <div className="border-t border-white/[.06] bg-[#0b1120] px-4 py-2.5 text-[10px] text-slate-500"><span className="text-slate-300">{source.label}</span><span className="mx-2">·</span>Authorized source</div>
    </div>
  );
}

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const seconds = Math.floor(value);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
