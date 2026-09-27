import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { COLORS, FPS } from "./constants";
import { Background } from "./components/Background";
import { fadeIn, fadeOut, scaleIn, slideUp, pulse } from "./helpers";
import { FRAME_TOP, ScreenRecordingFrame } from "./ShortVideo";
import voManifest from "../public/audio/vo-01.json";

// Video 1, voiced version. Timeline = the 5 VO sentences played back to back with a
// GAP_SEC silent gap after each. Scene 1 gets an extra LEAD_IN_SEC of silence before its
// audio starts (room for the kinetic typography to build); scene 5 holds HOLD_SEC after its
// audio ends (no gap follows it, it's the last scene). Frame math is derived from
// public/audio/vo-01.json at import time, so re-running scripts/tts.mjs (new audio, new
// durations) reflows the whole timeline with no manual recomputation.
// Exported: shared with RichVideoGeneric.tsx (RichVideo-02/03) so the "scene length =
// sentence audio + gap, lead-in on scene 1, hold on the last scene" timeline rule lives in
// ONE place. RichVideo01 below is untouched otherwise — see the regression check in
// README-short.md (24.09s ±0.1 re-render).
export const GAP_SEC = 0.35;
export const LEAD_IN_SEC = 0.6;
export const HOLD_SEC = 1.2;

// Same single recording + source windows as pilots/story-counter.json (selection / taps /
// relaunch), just re-timed to fit the (much shorter) VO-driven scene lengths instead of the
// silent video's caption-driven ones.
const RECORDING_SRC = "recordings/story-counter.mp4";
const SELECT_FROM = 0.3;
const SELECT_TO = 19.53;
const TAP_FROM = 19.53;
// Brief calls for "the last ~2.2s of source (the 33/33 completion) at 1.0x"; the pilot's own
// completion window (40.0 -> 43.72) is 3.72s, so we take its final 2.2s here and ramp
// everything before it (19.53 -> 41.52) to fill the rest of scene 3.
const TAP_COMPLETE_FROM = 41.52;
const TAP_TO = 43.72;
// Relaunch (scene 4) has three real phases in the source, verified frame-by-frame:
//   1. home screen tap (43.72 -> 44.6)
//   2. a genuinely blank/white iOS loading gap (44.6 -> 47.3, ~2.7s of nothing)
//   3. the transition-in + settled "33/33" screen (47.3 -> 48.2)
// Phase 1 is real-speed OffthreadVideo (proven reliable — see below). Phases 2 and 3 are NOT
// video anymore: DarkOverlay (app-dark background + icon) stands in for phase 2, crossfading
// into a single static <Img> of the settled 33/33 screen (public/recordings/
// relaunch-settled.png, pre-extracted with ffmpeg at source t=47.85s) for phase 3.
//
// This replaced FOUR different video-based attempts at phases 2/3, all of which reproducibly
// rendered BLANK frames — isolated single-frame renders proved it wasn't about nesting,
// opacity, absolute position, Sequence gaps, or chunk size: even individually fresh-mounted,
// single-frame OffthreadVideo instances of this source at a non-1.0x rate sometimes render
// blank with no discernible pattern. RATE=1.0 segments (this source's real-speed portions —
// see Scene3's 66-frame completion clip, and phase 1 here) never failed in any test, only
// sped-up/slowed-down/frozen ones did, unpredictably. Given that, phases 2-3 use no video
// decode at all instead of chasing the exact failure condition further.
const RELAUNCH_FROM = 43.72;
const RELAUNCH_HOME_TO = 44.6;
const RELAUNCH_SETTLED_IMAGE = "recordings/relaunch-settled.png";
// Fixed output-time budget for the home-tap phase (real speed).
const RELAUNCH_HOME_FRAMES = 27; // ~0.9s, near real speed on the icon tap
// DarkOverlay's own on-screen time, and the crossfade into the settled image that eats into
// its tail (so DarkOverlay's un-blended, fully-opaque portion is overlayFrames -
// crossfadeFrames).
const RELAUNCH_OVERLAY_FRAMES = 36; // ~1.2s
const RELAUNCH_CROSSFADE_FRAMES = 9; // ~0.3s

// public/recordings/ai-rehber.mp4 doesn't exist yet (user will record it on-device).
// Flip to true once that file lands in the repo, then re-render — no other change needed,
// AiRehberSlot below already fits/letterboxes whatever aspect ratio it turns out to be.
const AI_REHBER_AVAILABLE = false;
const AI_REHBER_SRC = "recordings/ai-rehber.mp4";

export interface SentenceInfo {
  index: number;
  text: string;
  file: string;
  durationSec: number;
  splitAtSec?: number;
}
const SENTENCES: SentenceInfo[] = (voManifest as { sentences: SentenceInfo[] }).sentences;

export function secToFrames(sec: number, fps: number) {
  return Math.round(sec * fps);
}

export interface Scene extends SentenceInfo {
  start: number; // absolute frame, scene start (may include lead-in silence)
  end: number; // absolute frame, scene end (includes trailing gap/hold)
  leadInFrames: number; // silent frames before audio starts, within this scene
  audioFrames: number;
  tailFrames: number; // gap (or hold, for the last scene) after audio, within this scene
  sceneFrames: number; // leadIn + audio + tail
}

// Exported: builds the timeline for ANY 5-sentence manifest, not just vo-01's (module-level
// SENTENCES below stays private to RichVideo01) — RichVideoGeneric.tsx calls this directly
// with vo-02/vo-03's sentences.
export function buildTimelineFor(sentences: SentenceInfo[], fps: number): Scene[] {
  const gapFrames = secToFrames(GAP_SEC, fps);
  const leadInFrames = secToFrames(LEAD_IN_SEC, fps);
  const holdFrames = secToFrames(HOLD_SEC, fps);
  let cursor = 0;
  return sentences.map((s, i) => {
    const audioFrames = secToFrames(s.durationSec, fps);
    const isFirst = i === 0;
    const isLast = i === sentences.length - 1;
    const lead = isFirst ? leadInFrames : 0;
    const tail = isLast ? holdFrames : gapFrames;
    const sceneFrames = lead + audioFrames + tail;
    const start = cursor;
    cursor += sceneFrames;
    return {
      ...s,
      start,
      end: start + sceneFrames,
      leadInFrames: lead,
      audioFrames,
      tailFrames: tail,
      sceneFrames,
    };
  });
}

function buildTimeline(fps: number): Scene[] {
  return buildTimelineFor(SENTENCES, fps);
}

export function richVideoDurationInFrames(fps: number = FPS): number {
  const timeline = buildTimeline(fps);
  return timeline[timeline.length - 1].end;
}

// A speed-ramped slice of RECORDING_SRC: source seconds [from, to) at `rate`x. startFrom/endAt
// are expressed in frames of the OUTPUT (composition) fps, same convention as
// ShortVideo.tsx's SegmentedRecording/RampedClip — Remotion maps them through `playbackRate`
// to media time internally.
// Exported: RichVideoGeneric.tsx reuses this against its own recording, RichVideo01's
// own RampedClip below stays a thin wrapper (RECORDING_SRC baked in) — no behavior change.
export function RampedClipFrom({ src, from, to, rate }: { src: string; from: number; to: number; rate: number }) {
  return (
    <OffthreadVideo
      src={staticFile(src)}
      startFrom={Math.round(from * FPS)}
      endAt={Math.round(to * FPS)}
      playbackRate={rate}
      style={{ width: "100%", height: "100%", objectFit: "contain" }}
      muted
    />
  );
}

function RampedClip({ from, to, rate }: { from: number; to: number; rate: number }) {
  return <RampedClipFrom src={RECORDING_SRC} from={from} to={to} rate={rate} />;
}

export function CaptionPill({ text }: { text: string }) {
  const frame = useCurrentFrame();
  const opacity = fadeIn(frame, 0, 10);
  const y = slideUp(frame, 0, 14, 20);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end" }}>
      <div
        style={{
          opacity,
          transform: `translateY(${y}px)`,
          marginBottom: 110,
          maxWidth: 900,
          background: COLORS.bgCard,
          border: `1px solid ${COLORS.goldAlpha30}`,
          borderRadius: 20,
          padding: "18px 36px",
          fontSize: 32,
          fontWeight: 700,
          color: COLORS.white,
          fontFamily: "sans-serif",
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
}

// Full-size phone frame, matching scenes 3/4 exactly — no shrinking (a scaled-down phone
// made the collections list / AI placeholder text unreadable at 1080x1920).
export function PhoneStage({ children, zIndex = 0 }: { children: React.ReactNode; zIndex?: number }) {
  const frame = useCurrentFrame();
  const introSlide = slideUp(frame, 0, 20, 30);
  return (
    <AbsoluteFill style={{ zIndex }}>
      <Background particles />
      <div
        style={{
          position: "absolute",
          top: FRAME_TOP,
          left: "50%",
          transform: `translate(-50%, ${introSlide}px)`,
        }}
      >
        <ScreenRecordingFrame>{children}</ScreenRecordingFrame>
      </div>
    </AbsoluteFill>
  );
}

function PillLabel({ text, delay }: { text: string; delay: number }) {
  const frame = useCurrentFrame();
  const opacity = fadeIn(frame, delay, 14);
  const y = slideUp(frame, delay, 16, 24);
  return (
    <div
      style={{
        opacity,
        transform: `translateY(${y}px)`,
        background: COLORS.bgCardLight,
        border: `1px solid ${COLORS.goldAlpha30}`,
        borderRadius: 30,
        padding: "14px 28px",
        fontSize: 28,
        fontWeight: 700,
        color: COLORS.goldLight,
        fontFamily: "sans-serif",
        textAlign: "center",
      }}
    >
      {text}
    </div>
  );
}

// Horizontal row of pills in the same band the caption pills sit in (scenes 3/4), under the
// full-size phone — replaces the old side-column layout that only fit at 0.74x scale.
function PillRow({ pills }: { pills: { text: string; delay: number }[] }) {
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end" }}>
      <div style={{ display: "flex", flexDirection: "row", gap: 16, marginBottom: 110 }}>
        {pills.map((p, i) => (
          <PillLabel key={i} text={p.text} delay={p.delay} />
        ))}
      </div>
    </AbsoluteFill>
  );
}

// AI Rehber slot (scene 2b). Shows the real recording once public/recordings/ai-rehber.mp4
// exists (AI_REHBER_AVAILABLE flipped to true); until then, a placeholder that reads as the
// real feature rather than a blank screen.
function AiRehberSlot({ available, src }: { available: boolean; src: string }) {
  if (available) {
    return (
      <OffthreadVideo
        src={staticFile(src)}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
        muted
      />
    );
  }
  const frame = useCurrentFrame();
  const iconOpacity = fadeIn(frame, 0, 16);
  const iconScale = scaleIn(frame, 0, 20, 0.8);
  const titleOpacity = fadeIn(frame, 10, 16);
  const subOpacity = fadeIn(frame, 18, 16);
  const cardOpacity = fadeIn(frame, 26, 16);
  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 22,
        padding: "0 40px",
      }}
    >
      <div
        style={{
          opacity: iconOpacity,
          transform: `scale(${iconScale})`,
          width: 140,
          height: 140,
          borderRadius: 32,
          overflow: "hidden",
          boxShadow: `0 12px 30px rgba(212,168,48,0.3)`,
        }}
      >
        <Img src={staticFile("applogo.webp")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div
        style={{
          opacity: titleOpacity,
          fontSize: 48,
          fontWeight: 800,
          color: COLORS.white,
          fontFamily: "sans-serif",
        }}
      >
        AI Rehber
      </div>
      <div
        style={{
          opacity: subOpacity,
          fontSize: 32,
          color: COLORS.whiteAlpha50,
          fontFamily: "sans-serif",
          textAlign: "center",
        }}
      >
        Niyetini yaz, kaynaklı öneri al
      </div>
      <div
        style={{
          opacity: cardOpacity,
          width: "88%",
          background: COLORS.bgCard,
          border: `1px solid ${COLORS.whiteAlpha10}`,
          borderRadius: 20,
          padding: "26px 28px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ height: 20, borderRadius: 10, background: COLORS.whiteAlpha20, width: "90%" }} />
        <div style={{ height: 20, borderRadius: 10, background: COLORS.whiteAlpha20, width: "70%" }} />
        <div style={{ height: 20, borderRadius: 10, background: COLORS.whiteAlpha10, width: "50%" }} />
        <div
          style={{
            fontSize: 24,
            color: COLORS.goldLight,
            fontFamily: "sans-serif",
            marginTop: 6,
          }}
        >
          Kaynak: kitap ve sayfa referansı
        </div>
      </div>
    </AbsoluteFill>
  );
}

// Scene 1 (hook): the sentence in 2-3 word kinetic groups on the brand background, one group
// visible at a time — a gentle blur/scale-in on entry, held, then swapped for the next.
export function KineticHook({
  text,
  activeFrom,
  activeTo,
}: {
  text: string;
  activeFrom: number;
  activeTo: number;
}) {
  const frame = useCurrentFrame();
  const words = text.split(" ");
  const groups: string[] = [];
  for (let i = 0; i < words.length; i += 3) groups.push(words.slice(i, i + 3).join(" "));

  const activeDuration = activeTo - activeFrom;
  const perGroup = Math.max(1, Math.floor(activeDuration / groups.length));

  const lineWidth = interpolate(frame, [0, 22], [0, 120], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lineOpacity = fadeIn(frame, 0, 20);

  return (
    <AbsoluteFill>
      <Background particles={false} />
      <AbsoluteFill
        style={{ alignItems: "center", justifyContent: "center", padding: "0 90px", flexDirection: "column" }}
      >
        <div
          style={{
            width: lineWidth,
            height: 3,
            borderRadius: 2,
            background: `linear-gradient(90deg, transparent, ${COLORS.gold}, transparent)`,
            opacity: lineOpacity,
            marginBottom: 40,
          }}
        />
        {groups.map((g, i) => {
          const groupStart = activeFrom + i * perGroup;
          const groupEnd = i === groups.length - 1 ? activeTo : groupStart + perGroup;
          const local = frame - groupStart;
          if (frame < groupStart - 4 || frame > groupEnd + 2) return null;
          // Cross-fade: fades in on entry, holds, then fades out in the last few frames of
          // its own window (not on a fixed delay) so it never overlaps the next group.
          const opacity = fadeIn(frame, groupStart, 12) * fadeOut(frame, groupEnd, 10);
          const scale = scaleIn(frame, groupStart, 16, 0.85);
          const blur = interpolate(local, [0, 12], [10, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                opacity,
                transform: `scale(${scale})`,
                filter: `blur(${blur}px)`,
                fontSize: 78,
                fontWeight: 800,
                color: COLORS.white,
                textAlign: "center",
                lineHeight: 1.25,
                fontFamily: "sans-serif",
              }}
            >
              {g}
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// Exported: no RECORDING_SRC dependency, so RichVideoGeneric.tsx reuses this directly
// for RichVideo-02/03's own hook scenes — no behavior change to RichVideo01.
export function HookScene({ scene }: { scene: Scene }) {
  return (
    <>
      <Sequence from={scene.leadInFrames} durationInFrames={scene.audioFrames} layout="none">
        <Audio src={staticFile(`audio/${scene.file}`)} volume={1.8} />
      </Sequence>
      <KineticHook
        text={scene.text}
        activeFrom={scene.leadInFrames}
        activeTo={scene.leadInFrames + scene.audioFrames + Math.round(scene.tailFrames * 0.4)}
      />
    </>
  );
}

function Scene2({ scene }: { scene: Scene }) {
  const { fps } = { fps: FPS };
  const splitFrame = secToFrames(scene.splitAtSec ?? 0, fps);
  const aFrames = splitFrame;
  const bFrames = scene.sceneFrames - aFrames;

  const selectRate = (SELECT_TO - SELECT_FROM) / (aFrames / fps);

  return (
    <>
      <Sequence from={0} durationInFrames={scene.audioFrames} layout="none">
        <Audio src={staticFile(`audio/${scene.file}`)} volume={1.8} />
      </Sequence>
      <Sequence from={0} durationInFrames={aFrames} layout="none">
        <PhoneStage>
          <RampedClip from={SELECT_FROM} to={SELECT_TO} rate={selectRate} />
        </PhoneStage>
        <PillRow
          pills={[
            { text: "Arapça", delay: 4 },
            { text: "Okunuş", delay: 12 },
            { text: "Anlam", delay: 20 },
          ]}
        />
      </Sequence>
      <Sequence from={aFrames} durationInFrames={bFrames} layout="none">
        <PhoneStage>
          <AiRehberSlot available={AI_REHBER_AVAILABLE} src={AI_REHBER_SRC} />
        </PhoneStage>
        <PillRow
          pills={[
            { text: "Arapça", delay: 0 },
            { text: "Okunuş", delay: 8 },
            { text: "Anlam", delay: 16 },
          ]}
        />
      </Sequence>
    </>
  );
}

function Scene3({ scene }: { scene: Scene }) {
  const fps = FPS;
  const completionFrames = secToFrames(TAP_TO - TAP_COMPLETE_FROM, fps); // ~2.2s at real speed
  const rampFrames = scene.sceneFrames - completionFrames;
  const rampRate = (TAP_COMPLETE_FROM - TAP_FROM) / (rampFrames / fps);
  const completionStart = rampFrames;

  return (
    <>
      <Sequence from={0} durationInFrames={scene.audioFrames} layout="none">
        <Audio src={staticFile(`audio/${scene.file}`)} volume={1.8} />
      </Sequence>
      <Sequence from={0} durationInFrames={rampFrames} layout="none">
        <PhoneStage>
          <RampedClip from={TAP_FROM} to={TAP_COMPLETE_FROM} rate={rampRate} />
        </PhoneStage>
      </Sequence>
      <Sequence from={completionStart} durationInFrames={completionFrames} layout="none">
        <PhoneStage>
          <RampedClip from={TAP_COMPLETE_FROM} to={TAP_TO} rate={1.0} />
        </PhoneStage>
        <CompletionBadge />
      </Sequence>
      <CaptionPill text={scene.text} />
    </>
  );
}

// Roughly where the counter ring sits inside the phone screen (see ScreenRecordingFrame /
// FRAME_TOP) — the badge overlays it, not the phone's header/status-bar area.
const COMPLETION_BADGE_TOP = 470;

function CompletionBadge() {
  const frame = useCurrentFrame();
  const opacity = fadeIn(frame, 0, 8);
  const scale = scaleIn(frame, 0, 14, 0.5) * pulse(frame, 0.25, 0.97, 1.05);
  return (
    <AbsoluteFill
      style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: COMPLETION_BADGE_TOP }}
    >
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          width: 130,
          height: 130,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.goldLight} 0%, ${COLORS.gold} 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 52,
          fontWeight: 800,
          color: "#000",
          fontFamily: "sans-serif",
          boxShadow: "0 12px 40px rgba(212,168,48,0.5)",
        }}
      >
        33
      </div>
    </AbsoluteFill>
  );
}

// Dark stand-in for the source's blank/white loading gap (scene 4) — same app-dark
// background and centered icon instead of a flash of white in an otherwise dark video. The
// icon does a single gentle settle (0.96 -> 1.0), not a repeating pulse. `durationInFrames`
// is this component's OWN Sequence length, so it can fade itself out over the last
// `crossfadeFrames` to blend into the payoff clip fading in on top of it.
function DarkOverlay({
  durationInFrames,
  crossfadeFrames,
}: {
  durationInFrames: number;
  crossfadeFrames: number;
}) {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 24], [0.96, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = fadeOut(frame, durationInFrames, crossfadeFrames);
  return (
    <AbsoluteFill style={{ opacity, background: COLORS.bg, alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          transform: `scale(${scale})`,
          width: 120,
          height: 120,
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "0 12px 30px rgba(212,168,48,0.3)",
        }}
      >
        <Img src={staticFile("applogo.webp")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    </AbsoluteFill>
  );
}

// The settled 33/33 screen — a static image (see RELAUNCH_SETTLED_IMAGE), not video. No
// opacity animation here; the crossfade is entirely DarkOverlay fading out on top of this
// always-fully-opaque, always-fully-legible image underneath.
function SettledImage() {
  return (
    <Img
      src={staticFile(RELAUNCH_SETTLED_IMAGE)}
      style={{ width: "100%", height: "100%", objectFit: "contain" }}
    />
  );
}

function Scene4({ scene }: { scene: Scene }) {
  const fps = FPS;
  // home-tap (real speed, video) -> DarkOverlay (stands in for the source's blank loading
  // flash) -> crossfade into the settled 33/33 (a static image, not video — see the
  // constants comment above for why) filling whatever scene time is left.
  const homeFrames = RELAUNCH_HOME_FRAMES;
  const overlayFrames = RELAUNCH_OVERLAY_FRAMES;
  const crossfadeFrames = RELAUNCH_CROSSFADE_FRAMES;
  const overlayStart = homeFrames;
  const settledStart = overlayStart + overlayFrames - crossfadeFrames;
  const settledFrames = Math.max(1, scene.sceneFrames - settledStart);
  const homeRate = (RELAUNCH_HOME_TO - RELAUNCH_FROM) / (homeFrames / fps);
  // Each phase gets its OWN top-level Sequence + PhoneStage (same pattern as Scene3's
  // ramp/completion split). DarkOverlay and SettledImage deliberately OVERLAP for
  // crossfadeFrames (settledStart is inside the overlay's own span) — that overlap IS the
  // crossfade: DarkOverlay fades itself out (higher PhoneStage zIndex), revealing
  // SettledImage underneath.
  return (
    <>
      <Sequence from={0} durationInFrames={scene.audioFrames} layout="none">
        <Audio src={staticFile(`audio/${scene.file}`)} volume={1.8} />
      </Sequence>
      <Sequence from={0} durationInFrames={homeFrames} layout="none">
        <PhoneStage>
          <RampedClip from={RELAUNCH_FROM} to={RELAUNCH_HOME_TO} rate={homeRate} />
        </PhoneStage>
      </Sequence>
      <Sequence from={settledStart} durationInFrames={settledFrames} layout="none">
        <PhoneStage>
          <SettledImage />
        </PhoneStage>
      </Sequence>
      <Sequence from={overlayStart} durationInFrames={overlayFrames} layout="none">
        <PhoneStage zIndex={2}>
          <DarkOverlay durationInFrames={overlayFrames} crossfadeFrames={crossfadeFrames} />
        </PhoneStage>
      </Sequence>
      <CaptionPill text={scene.text} />
    </>
  );
}

// Exported for the same reason as HookScene above (brand outro ignores scene.text/
// hardcodes brand copy — fully generic across videos).
export function BrandOutroScene({ scene }: { scene: Scene }) {
  const frame = useCurrentFrame();
  const logoScale = scaleIn(frame, 0, 24, 0.75);
  const nameOpacity = fadeIn(frame, 10, 18);
  const nameY = slideUp(frame, 10, 18, 26);
  const lineOpacity = fadeIn(frame, 22, 16);
  const ctaOpacity = fadeIn(frame, 34, 18);
  const ctaY = slideUp(frame, 34, 18, 26);

  return (
    <>
      <Sequence from={0} durationInFrames={scene.audioFrames} layout="none">
        <Audio src={staticFile(`audio/${scene.file}`)} volume={1.8} />
      </Sequence>
      <AbsoluteFill>
        <Background particles={false} />
        <AbsoluteFill
          style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20 }}
        >
          <div
            style={{
              transform: `scale(${logoScale})`,
              width: 200,
              height: 200,
              borderRadius: 44,
              overflow: "hidden",
              boxShadow: `0 20px 60px rgba(212,168,48,0.35)`,
              border: `2px solid ${COLORS.goldAlpha30}`,
            }}
          >
            <Img src={staticFile("applogo.webp")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div
            style={{
              opacity: nameOpacity,
              transform: `translateY(${nameY}px)`,
              fontSize: 52,
              fontWeight: 800,
              color: COLORS.white,
              fontFamily: "sans-serif",
              textAlign: "center",
            }}
          >
            Zikirmatik Asistan
          </div>
          <div
            style={{
              opacity: lineOpacity,
              fontSize: 26,
              color: COLORS.whiteAlpha50,
              fontFamily: "sans-serif",
            }}
          >
            Reklamsız · Ücretsiz
          </div>
          <div
            style={{
              opacity: ctaOpacity,
              transform: `translateY(${ctaY}px)`,
              marginTop: 24,
              background: COLORS.gold,
              borderRadius: 50,
              padding: "22px 64px",
              fontSize: 30,
              fontWeight: 800,
              color: "#000",
              fontFamily: "sans-serif",
              boxShadow: "0 8px 40px rgba(212,168,48,0.4)",
            }}
          >
            Google Play&apos;de ücretsiz
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </>
  );
}

export const RichVideo01: React.FC = () => {
  const timeline = buildTimeline(FPS);
  const [s1, s2, s3, s4, s5] = timeline;
  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      <Sequence from={s1.start} durationInFrames={s1.sceneFrames} layout="none">
        <HookScene scene={s1} />
      </Sequence>
      <Sequence from={s2.start} durationInFrames={s2.sceneFrames} layout="none">
        <Scene2 scene={s2} />
      </Sequence>
      <Sequence from={s3.start} durationInFrames={s3.sceneFrames} layout="none">
        <Scene3 scene={s3} />
      </Sequence>
      <Sequence from={s4.start} durationInFrames={s4.sceneFrames} layout="none">
        <Scene4 scene={s4} />
      </Sequence>
      <Sequence from={s5.start} durationInFrames={s5.sceneFrames} layout="none">
        <BrandOutroScene scene={s5} />
      </Sequence>
    </AbsoluteFill>
  );
};
