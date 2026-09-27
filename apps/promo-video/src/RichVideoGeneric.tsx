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
export type SegmentSpec =
  | { kind: "ramp"; from: number; to: number }
  | { kind: "fixed"; from: number; to: number; rate: number };

export interface BadgeSpec {
  text: string;
  // Frame offset from the START of the segment it's attached to (segmentIndex into
  // `segments`), and its own on-screen duration in output frames.
  segmentIndex: number;
  atFrame: number;
  durationFrames: number;
}

export interface MiddleSceneSpec {
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
}

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

function MiddleScene({ scene, spec, recordingSrc }: { scene: Scene; spec: MiddleSceneSpec; recordingSrc: string }) {
  const fps = FPS;

  if (spec.staticImage) {
    return (
      <>
        <Sequence from={0} durationInFrames={scene.audioFrames} layout="none">
          <Audio src={staticFile(`audio/${scene.file}`)} volume={1.8} />
        </Sequence>
        <PhoneStage>
          <Img src={staticFile(spec.staticImage)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </PhoneStage>
        <CaptionPill text={scene.text} />
      </>
    );
  }

  const segments = spec.segments ?? [];
  const fixedFramesTotal = segments
    .filter((s): s is { kind: "fixed"; from: number; to: number; rate: number } => s.kind === "fixed")
    .reduce((sum, s) => sum + secToFrames((s.to - s.from) / s.rate, fps), 0);
  const rampOutputFrames = Math.max(0, scene.sceneFrames - fixedFramesTotal);

  let cursor = 0;
  const rendered = segments.map((seg, i) => {
    let outputFrames: number;
    let rate: number;
    if (seg.kind === "ramp") {
      outputFrames = rampOutputFrames;
      rate = outputFrames > 0 ? (seg.to - seg.from) / (outputFrames / fps) : 1;
    } else {
      outputFrames = secToFrames((seg.to - seg.from) / seg.rate, fps);
      rate = seg.rate;
    }
    const from = cursor;
    cursor += outputFrames;
    const badge = spec.badge && spec.badge.segmentIndex === i ? spec.badge : null;
    return (
      <Sequence key={i} from={from} durationInFrames={Math.max(1, outputFrames)} layout="none">
        <PhoneStage>
          <RampedClipFrom src={recordingSrc} from={seg.from} to={seg.to} rate={rate} />
        </PhoneStage>
        {badge ? (
          <Sequence from={badge.atFrame} durationInFrames={badge.durationFrames} layout="none">
            <PulseBadge text={badge.text} />
          </Sequence>
        ) : null}
      </Sequence>
    );
  });

  return (
    <>
      <Sequence from={0} durationInFrames={scene.audioFrames} layout="none">
        <Audio src={staticFile(`audio/${scene.file}`)} volume={1.8} />
      </Sequence>
      {rendered}
      {/* Captions under the phone for scenes 2-4, per the brief. */}
      <CaptionPill text={scene.text} />
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
          <MiddleScene scene={s2} spec={manifest.scenes[0]} recordingSrc={manifest.recordingSrc} />
        </Sequence>
        <Sequence from={s3.start} durationInFrames={s3.sceneFrames} layout="none">
          <MiddleScene scene={s3} spec={manifest.scenes[1]} recordingSrc={manifest.recordingSrc} />
        </Sequence>
        <Sequence from={s4.start} durationInFrames={s4.sceneFrames} layout="none">
          <MiddleScene scene={s4} spec={manifest.scenes[2]} recordingSrc={manifest.recordingSrc} />
        </Sequence>
        <Sequence from={s5.start} durationInFrames={s5.sceneFrames} layout="none">
          <BrandOutroScene scene={s5} />
        </Sequence>
      </AbsoluteFill>
    );
  };
}
