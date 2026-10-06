import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame } from "remotion";
import { FPS } from "./constants";
import {
  buildTimelineFor,
  secToFrames,
  RampedClipFrom,
  CaptionPill,
  PhoneStage,
  HookScene,
  BrandOutroScene,
  type Scene,
  type SentenceInfo,
} from "./RichVideo";
import { fadeIn, scaleIn, pulse } from "./helpers";
import { COLORS } from "./constants";

// Generic, JSON-driven RichVideo for any video whose 5-sentence VO manifest follows the
// same shape as vo-01.json (hook -> scene2 -> scene3 -> scene4 -> brand outro) and whose
// scenes 2-4 are each ONE recording, speed-ramped to fit, with a caption + optional badge
// (see pilots/rich-02.json, pilots/rich-03.json). RichVideo01 (src/RichVideo.tsx) is NOT
// implemented in terms of this — it keeps its own bespoke Scene2/3/4 (AI Rehber split,
// dark-overlay relaunch trick) untouched, this file only reuses its side-effect-free
// exports (HookScene/BrandOutroScene/RampedClipFrom/CaptionPill/PhoneStage/buildTimelineFor).

// One speed-ramped slice of the scene's recording. Exactly two kinds, matching
// RichVideo01's own Scene3 pattern:
//   - "ramp": fills whatever output time is LEFT after the fixed segments in this scene
//     (at most one per scene — the fast-forward part).
//   - "fixed": a fixed real-seconds window played at an explicit `rate` (>= 0.56, the
//     OffthreadVideo blank-frame floor — see README-short.md) — the payoff moment.
//   `share` (optional, default 1): relative weight when a scene has several ramps — the time
//   left after the fixed segments is split between ramps in proportion to their shares.
export type SegmentSpec =
  | { kind: "ramp"; from: number; to: number; share?: number }
  | { kind: "fixed"; from: number; to: number; rate: number };

export interface BadgeSpec {
  text: string;
  // Frame offset from the START of the segment it's attached to (segmentIndex into
  // `segments`), and its own on-screen duration in output frames.
  segmentIndex: number;
  atFrame: number;
  durationFrames: number;
}

// Optional phone placement (RichVideo-04): see PhoneStage in RichVideo.tsx.
export interface PhoneSpec {
  scale?: number;
  top?: number;
  fadeBottom?: [number, number];
}

export interface MiddleSceneSpec {
  // Per-scene recording (falls back to manifest.recordingSrc).
  recordingSrc?: string;
  phone?: PhoneSpec;
  // Extra rectangles (source-video px) painted with maskColor over this scene's video, e.g. a
  // line of personal text. Default: none.
  maskRects?: { x: number; y: number; w: number; h: number }[];
  // Either a video (segments, speed-ramped) OR a single static image filling the whole
  // scene — the same "static frame" trick RichVideo01 uses for its own unreliable relaunch
  // tail (RELAUNCH_SETTLED_IMAGE/SettledImage): `simctl io recordVideo` can lose the last
  // ~5-8s of a capture after SIGINT (verified live, see story-circle.e2e.js), so when the
  // payoff moment didn't survive in the video, the recording spec grabs it as a plain
  // screenshot instead and this renders that PNG for the scene's full duration.
  segments?: SegmentSpec[];
  staticImage?: string;
  badge?: BadgeSpec;
}

export interface RichVideoManifest {
  recordingSrc: string;
  voManifest: { sentences: SentenceInfo[] };
  scenes: [MiddleSceneSpec, MiddleSceneSpec, MiddleSceneSpec]; // scene2, scene3, scene4
  // All optional; omitted = the original look (RichVideo-02/03 unchanged).
  // Paint the app background over the phone's status bar / Android nav bar (source-video px).
  maskTopPx?: number;
  maskBottomPx?: number;
  maskColor?: string;
  // Caption pill bottom margin (default 110) and max width (default 900).
  captionBottom?: number;
  captionMaxWidth?: number;
  // Defaults for every scene's `phone`.
  phone?: PhoneSpec;
}

// Source recordings are 1080x2340 Android captures (RichVideo-04); mask px -> % of height.
const SOURCE_HEIGHT_PX = 2340;
const SOURCE_WIDTH_PX = 1080;

export function richVideoGenericDurationInFrames(manifest: RichVideoManifest, fps: number = FPS): number {
  const timeline = buildTimelineFor(manifest.voManifest.sentences, fps);
  return timeline[timeline.length - 1].end;
}

// Small gold pulse label (reused shape from RichVideo01's CompletionBadge/PillLabel) —
// generic text, generic position band under the phone (same as CaptionPill's band, but
// higher up so it doesn't collide with the caption itself).
function PulseBadge({ text }: { text: string }) {
  const frame = useCurrentFrame();
  const opacity = fadeIn(frame, 0, 8);
  const scale = scaleIn(frame, 0, 14, 0.6) * pulse(frame, 0.25, 0.97, 1.05);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end" }}>
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          marginBottom: 230,
          background: `linear-gradient(135deg, ${COLORS.goldLight}, ${COLORS.gold})`,
          borderRadius: 30,
          padding: "12px 28px",
          fontSize: 26,
          fontWeight: 800,
          color: "#000",
          fontFamily: "sans-serif",
          boxShadow: "0 10px 30px rgba(212,168,48,0.45)",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
}

function MiddleScene({ scene, spec, manifest }: { scene: Scene; spec: MiddleSceneSpec; manifest: RichVideoManifest }) {
  const fps = FPS;
  const recordingSrc = spec.recordingSrc ?? manifest.recordingSrc;
  const phone = { ...manifest.phone, ...spec.phone };
  const maskColor = manifest.maskColor ?? "#030107";
  const caption = <CaptionPill text={scene.text} bottom={manifest.captionBottom} maxWidth={manifest.captionMaxWidth} />;

  if (spec.staticImage) {
    return (
      <>
        <Sequence from={0} durationInFrames={scene.audioFrames} layout="none">
          <Audio src={staticFile(`audio/${scene.file}`)} volume={1.8} />
        </Sequence>
        <PhoneStage {...phone}>
          <Img src={staticFile(spec.staticImage)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </PhoneStage>
        {caption}
      </>
    );
  }

  const segments = spec.segments ?? [];
  const fixedFramesTotal = segments
    .filter((s): s is { kind: "fixed"; from: number; to: number; rate: number } => s.kind === "fixed")
    .reduce((sum, s) => sum + secToFrames((s.to - s.from) / s.rate, fps), 0);
  const rampOutputFrames = Math.max(0, scene.sceneFrames - fixedFramesTotal);
  const rampShareTotal = segments.reduce((sum, s) => sum + (s.kind === "ramp" ? (s.share ?? 1) : 0), 0);

  // ONE PhoneStage per scene (its intro slide must play once, not at every segment
  // boundary); the per-segment clips are Sequences inside it, the masks sit on top for the
  // whole scene.
  let cursor = 0;
  const clips: React.ReactNode[] = [];
  const badges: React.ReactNode[] = [];
  segments.forEach((seg, i) => {
    let outputFrames: number;
    let rate: number;
    if (seg.kind === "ramp") {
      outputFrames = Math.round((rampOutputFrames * (seg.share ?? 1)) / rampShareTotal);
      rate = outputFrames > 0 ? (seg.to - seg.from) / (outputFrames / fps) : 1;
    } else {
      outputFrames = secToFrames((seg.to - seg.from) / seg.rate, fps);
      rate = seg.rate;
    }
    const from = cursor;
    cursor += outputFrames;
    clips.push(
      <Sequence key={i} from={from} durationInFrames={Math.max(1, outputFrames)} layout="none">
        <RampedClipFrom src={recordingSrc} from={seg.from} to={seg.to} rate={rate} />
      </Sequence>,
    );
    if (spec.badge && spec.badge.segmentIndex === i) {
      badges.push(
        <Sequence key={`b${i}`} from={from + spec.badge.atFrame} durationInFrames={spec.badge.durationFrames} layout="none">
          <PulseBadge text={spec.badge.text} />
        </Sequence>,
      );
    }
  });
  const rendered = (
    <>
      <PhoneStage {...phone}>
        {clips}
        {manifest.maskTopPx ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: `${(manifest.maskTopPx / SOURCE_HEIGHT_PX) * 100}%`, background: maskColor }} />
        ) : null}
        {(spec.maskRects ?? []).map((r, k) => (
          <div
            key={k}
            style={{
              position: "absolute",
              left: `${(r.x / SOURCE_WIDTH_PX) * 100}%`,
              top: `${(r.y / SOURCE_HEIGHT_PX) * 100}%`,
              width: `${(r.w / SOURCE_WIDTH_PX) * 100}%`,
              height: `${(r.h / SOURCE_HEIGHT_PX) * 100}%`,
              background: maskColor,
            }}
          />
        ))}
        {manifest.maskBottomPx ? (
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${(manifest.maskBottomPx / SOURCE_HEIGHT_PX) * 100}%`, background: maskColor }} />
        ) : null}
      </PhoneStage>
      {badges}
    </>
  );

  return (
    <>
      <Sequence from={0} durationInFrames={scene.audioFrames} layout="none">
        <Audio src={staticFile(`audio/${scene.file}`)} volume={1.8} />
      </Sequence>
      {rendered}
      {/* Captions under the phone for scenes 2-4, per the brief. */}
      {caption}
    </>
  );
}

export function createRichVideo(manifest: RichVideoManifest): React.FC {
  return function RichVideoComponent() {
    const timeline = buildTimelineFor(manifest.voManifest.sentences, FPS);
    const [s1, s2, s3, s4, s5] = timeline;
    return (
      <AbsoluteFill style={{ background: COLORS.bg }}>
        <Sequence from={s1.start} durationInFrames={s1.sceneFrames} layout="none">
          <HookScene scene={s1} />
        </Sequence>
        <Sequence from={s2.start} durationInFrames={s2.sceneFrames} layout="none">
          <MiddleScene scene={s2} spec={manifest.scenes[0]} manifest={manifest} />
        </Sequence>
        <Sequence from={s3.start} durationInFrames={s3.sceneFrames} layout="none">
          <MiddleScene scene={s3} spec={manifest.scenes[1]} manifest={manifest} />
        </Sequence>
        <Sequence from={s4.start} durationInFrames={s4.sceneFrames} layout="none">
          <MiddleScene scene={s4} spec={manifest.scenes[2]} manifest={manifest} />
        </Sequence>
        <Sequence from={s5.start} durationInFrames={s5.sceneFrames} layout="none">
          <BrandOutroScene scene={s5} />
        </Sequence>
      </AbsoluteFill>
    );
  };
}
