import React from "react";
import {
  AbsoluteFill,
  Img,
  Loop,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, HEIGHT, FPS } from "./constants";
import { Background } from "./components/Background";
import { fadeIn, fadeOut, scaleIn, slideUp } from "./helpers";

export interface ShortVideoCaption {
  text: string;
  /** Legacy: seconds from the start of the body beat (not the whole video). */
  startSec?: number;
  durationSec?: number;
  /**
   * Preferred: explicit window, seconds from the start of the body beat — on the OUTPUT
   * (compressed) timeline when `segments` is set, since the body's own length is then the
   * sum of the segments' ramped durations, not the source recording's real length.
   */
  from?: number;
  to?: number;
}

/**
 * One speed-ramped slice of `recordingSrc`: plays source seconds [from, to) at `rate`×,
 * so it takes (to-from)/rate output seconds. Slices play back to back in array order — this
 * is how a single, unlooped recording can be compressed into a shorter body without cutting
 * or looping any of it (see README-short.md "no looping" rule).
 */
export interface ShortVideoSegment {
  from: number;
  to: number;
  rate: number;
}

export interface ShortVideoProps {
  hookText?: string;
  captions?: ShortVideoCaption[];
  recordingSrc?: string;
  sourceLine?: string;
  ctaText?: string;
  appName?: string;
  appIconSrc?: string;
  /** Length of recordingSrc in frames, used to loop it across the body beat (legacy pilots). */
  recordingLoopFrames?: number;
  /**
   * Loop the recording across a fixed-length body beat (legacy pilots, ~25s body).
   * Default false: the recording plays exactly once, at its natural length
   * (recordingDurationSec) or per `segments`, no looping — see README-short.md.
   */
  loop?: boolean;
  /** Body beat length in seconds when loop=false and no `segments` — the recording's real duration. */
  recordingDurationSec?: number;
  /**
   * Speed-ramped slices of recordingSrc, played back to back (see ShortVideoSegment). When
   * set, this — not `recordingDurationSec` — determines the body length, and takes priority
   * over `loop`.
   */
  segments?: ShortVideoSegment[];
  /** Outro beat length in seconds. Default 5 (legacy pilots); story videos use 4. */
  outroSec?: number;
}

// Fixed beat layout (frames, at 30fps). Hook is always 3s. The body is either `segments`
// (speed-ramped slices), the legacy fixed 25s loop (loop=true), or the recording's real
// length (loop=false, default, no segments).
const HOOK_SEC = 3;
const LEGACY_LOOP_BODY_FRAMES = 750; // 25s @ 30fps
const DEFAULT_OUTRO_SEC = 5;

function segmentsBodyFrames(segments: ShortVideoSegment[], fps: number): number {
  return segments.reduce(
    (sum, seg) => sum + Math.max(1, Math.round(((seg.to - seg.from) / seg.rate) * fps)),
    0
  );
}

function bodyFramesFor(
  props: Pick<ShortVideoProps, "loop" | "recordingDurationSec" | "segments">,
  fps: number
): number {
  if (props.segments && props.segments.length > 0) {
    return segmentsBodyFrames(props.segments, fps);
  }
  if (props.loop === true) {
    return LEGACY_LOOP_BODY_FRAMES;
  }
  return Math.round((props.recordingDurationSec ?? 0) * fps);
}

export function shortVideoDurationInFrames(
  props: Pick<ShortVideoProps, "loop" | "recordingDurationSec" | "outroSec" | "segments">,
  fps: number = FPS
): number {
  const hookFrames = Math.round(HOOK_SEC * fps);
  const bodyFrames = bodyFramesFor(props, fps);
  const outroFrames = Math.round((props.outroSec ?? DEFAULT_OUTRO_SEC) * fps);
  return hookFrames + bodyFrames + outroFrames;
}

// Kept for the legacy fixed compositions (loop=true, 5s outro): 90 + 750 + 150 = 990.
export const SHORT_VIDEO_TOTAL_FRAMES = shortVideoDurationInFrames({ loop: true }, FPS);
// Hook length never varies by props (always 3s) — safe as a module constant.
const HOOK_END = Math.round(HOOK_SEC * FPS);

function HookBeat({ hookText }: { hookText: string }) {
  const frame = useCurrentFrame();
  const opacity = fadeIn(frame, 0, 18) * fadeOut(frame, HOOK_END, 15);
  const y = slideUp(frame, 0, 22, 40);
  const scale = scaleIn(frame, 0, 24, 0.9);
  const lineOpacity = fadeIn(frame, 0, 20) * fadeOut(frame, HOOK_END, 15);
  const lineWidth = interpolate(frame, [0, 22], [0, 120], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <Background particles={false} />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          padding: "0 100px",
        }}
      >
        <div
          style={{
            width: lineWidth,
            height: 3,
            borderRadius: 2,
            background: `linear-gradient(90deg, transparent, ${COLORS.gold}, transparent)`,
            opacity: lineOpacity,
            marginBottom: 36,
          }}
        />
        <div
          style={{
            opacity,
            transform: `translateY(${y}px) scale(${scale})`,
            fontSize: 76,
            fontWeight: 800,
            color: COLORS.white,
            textAlign: "center",
            lineHeight: 1.25,
            fontFamily: "sans-serif",
          }}
        >
          {hookText}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// Device frame sized to exactly match the captured recording's aspect ratio
// (1206x2622, the device's native pixel resolution) so the video is never
// cropped inside it. No synthetic notch: the screen recording already
// contains the real iOS status bar.
const FRAME_HEIGHT = Math.round(HEIGHT * 0.82);
const FRAME_BEZEL = 14;
const FRAME_RADIUS = 48;
const RECORDING_ASPECT = 1206 / 2622;
const SCREEN_HEIGHT = FRAME_HEIGHT - FRAME_BEZEL * 2;
const SCREEN_WIDTH = Math.round(SCREEN_HEIGHT * RECORDING_ASPECT);
const FRAME_WIDTH = SCREEN_WIDTH + FRAME_BEZEL * 2;
export const FRAME_TOP = 56;

export function ScreenRecordingFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: FRAME_WIDTH,
        height: FRAME_HEIGHT,
        borderRadius: FRAME_RADIUS,
        background: "#0a0a0a",
        boxShadow: `
          0 0 0 2px #2a2a2a,
          0 40px 120px rgba(0,0,0,0.7),
          0 0 80px rgba(212,168,48,0.15)
        `,
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: FRAME_BEZEL,
          left: FRAME_BEZEL,
          right: FRAME_BEZEL,
          bottom: FRAME_BEZEL,
          borderRadius: FRAME_RADIUS - FRAME_BEZEL,
          overflow: "hidden",
          background: COLORS.bg,
        }}
      >
        {children}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: FRAME_RADIUS,
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

function SegmentedRecording({
  recordingSrc,
  segments,
  fps,
}: {
  recordingSrc: string;
  segments: ShortVideoSegment[];
  fps: number;
}) {
  // <Sequence from> is absolute (relative to the composition root), NOT relative to when
  // BodyBeat happens to mount — BodyBeat isn't itself wrapped in a <Sequence>, it's just
  // conditionally rendered via `isBody &&`. Without this offset every segment played
  // HOOK_END frames (3s) too early, cutting the last segment off 3s short (verified by
  // frame-diffing the render against the source clip — see report).
  let cursor = HOOK_END;
  return (
    <>
      {segments.map((seg, i) => {
        const outFrames = Math.max(1, Math.round(((seg.to - seg.from) / seg.rate) * fps));
        const from = cursor;
        cursor += outFrames;
        return (
          // layout="none": these are stacked back to back in TIME, not space — each fills
          // the same frame, one after another.
          <Sequence key={i} from={from} durationInFrames={outFrames} layout="none">
            <OffthreadVideo
              src={recordingSrc}
              startFrom={Math.round(seg.from * fps)}
              endAt={Math.round(seg.to * fps)}
              playbackRate={seg.rate}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
              muted
            />
          </Sequence>
        );
      })}
    </>
  );
}

function BodyBeat({
  recordingSrc,
  captions,
  recordingLoopFrames,
  loop,
  segments,
  bodyEnd,
}: {
  recordingSrc: string;
  captions: ShortVideoCaption[];
  recordingLoopFrames: number;
  loop: boolean;
  segments?: ShortVideoSegment[];
  bodyEnd: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - HOOK_END;
  const localDuration = bodyEnd - HOOK_END;

  const beatOpacity =
    fadeIn(frame, HOOK_END, 18) * fadeOut(frame, bodyEnd, 18);

  // Gentle continuous zoom-in on the counter over the whole body beat only
  // (captions below are siblings, outside this transform, and never zoom).
  const zoom = interpolate(localFrame, [0, localDuration], [1, 1.06], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const introSlide = slideUp(frame, HOOK_END, 25, 30);

  return (
    <AbsoluteFill style={{ opacity: beatOpacity }}>
      <Background particles />
      <div
        style={{
          position: "absolute",
          top: FRAME_TOP,
          left: "50%",
          transform: `translate(-50%, ${introSlide}px) scale(${zoom})`,
          transformOrigin: "top center",
        }}
      >
        <ScreenRecordingFrame>
          {segments && segments.length > 0 ? (
            // Speed-ramped slices of the SAME single recording, back to back — still no
            // looping and no cutting, just variable playback rate (see ShortVideoSegment).
            <SegmentedRecording recordingSrc={recordingSrc} segments={segments} fps={fps} />
          ) : loop ? (
            <Loop durationInFrames={recordingLoopFrames}>
              <OffthreadVideo
                src={recordingSrc}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
                muted
              />
            </Loop>
          ) : (
            // Plays exactly once, at its natural length — no looping (see README-short.md,
            // "the body plays the recording exactly once at its natural length").
            <OffthreadVideo
              src={recordingSrc}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
              muted
            />
          )}
        </ScreenRecordingFrame>
      </div>

      {captions.map((caption, i) => {
        const startSec = caption.from ?? caption.startSec ?? 0;
        const endSec = caption.to ?? startSec + (caption.durationSec ?? 0);
        const startFrame = HOOK_END + Math.round(startSec * fps);
        const endFrame = HOOK_END + Math.round(endSec * fps);
        const capOpacity =
          fadeIn(frame, startFrame, 12) * fadeOut(frame, endFrame, 12);
        const capY = slideUp(frame, startFrame, 15, 24);
        if (frame < startFrame - 15 || frame > endFrame + 15) return null;
        return (
          <AbsoluteFill
            key={i}
            style={{ alignItems: "center", justifyContent: "flex-end" }}
          >
            <div
              style={{
                opacity: capOpacity,
                transform: `translateY(${capY}px)`,
                marginBottom: 110,
                background: COLORS.bgCard,
                border: `1px solid ${COLORS.goldAlpha30}`,
                borderRadius: 20,
                padding: "18px 36px",
                fontSize: 34,
                fontWeight: 700,
                color: COLORS.white,
                fontFamily: "sans-serif",
                boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
              }}
            >
              {caption.text}
            </div>
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
}

export function OutroBeat({
  sourceLine,
  ctaText,
  appName,
  appIconSrc,
  bodyEnd,
}: {
  sourceLine: string;
  ctaText: string;
  appName: string;
  appIconSrc: string;
  bodyEnd: number;
}) {
  const frame = useCurrentFrame();
  const start = bodyEnd;
  const opacity = fadeIn(frame, start, 18);
  const logoScale = scaleIn(frame, start, 24, 0.75);
  const nameOpacity = fadeIn(frame, start + 12, 18);
  const nameY = slideUp(frame, start + 12, 18, 26);
  const ctaOpacity = fadeIn(frame, start + 26, 18);
  const ctaY = slideUp(frame, start + 26, 18, 26);
  const sourceOpacity = fadeIn(frame, start + 38, 16);

  return (
    <AbsoluteFill style={{ opacity }}>
      <Background particles={false} />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 20,
        }}
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
          <Img
            src={appIconSrc}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
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
          {appName}
        </div>

        <div
          style={{
            opacity: sourceOpacity,
            fontSize: 24,
            color: COLORS.whiteAlpha50,
            fontFamily: "sans-serif",
          }}
        >
          {sourceLine}
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
          {ctaText}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export const ShortVideo: React.FC<ShortVideoProps> = ({
  hookText = "Örnek kanca metni",
  captions = [],
  recordingSrc = staticFile("recordings/counter-pilot.mp4"),
  sourceLine = "Kaynak: —",
  ctaText = "Google Play'de ücretsiz",
  appName = "Zikirmatik Asistan",
  appIconSrc = staticFile("applogo.webp"),
  recordingLoopFrames = 309,
  loop = false,
  recordingDurationSec,
  segments,
  outroSec = DEFAULT_OUTRO_SEC,
}) => {
  void outroSec; // duration is computed by shortVideoDurationInFrames; kept for prop parity
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bodyFrames = bodyFramesFor({ loop, recordingDurationSec, segments }, fps);
  const bodyEnd = HOOK_END + bodyFrames;
  const isHook = frame < HOOK_END;
  const isBody = frame >= HOOK_END - 15 && frame < bodyEnd + 15;
  const isOutro = frame >= bodyEnd;

  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      {isHook && <HookBeat hookText={hookText} />}
      {isBody && (
        <BodyBeat
          recordingSrc={recordingSrc}
          captions={captions}
          recordingLoopFrames={recordingLoopFrames}
          loop={loop}
          segments={segments}
          bodyEnd={bodyEnd}
        />
      )}
      {isOutro && (
        <OutroBeat
          bodyEnd={bodyEnd}
          sourceLine={sourceLine}
          ctaText={ctaText}
          appName={appName}
          appIconSrc={appIconSrc}
        />
      )}
    </AbsoluteFill>
  );
};
