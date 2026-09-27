#!/usr/bin/env node
// Scripted screen-recording pipeline for promo-video short clips.
//
//   node scripts/record.mjs <flow>          (flow: counter | library | themes)
//
// Prerequisites (see README-short.md):
//   - Docker Desktop running, `pnpm db:test` up, apps/api built + running with the
//     env block from apps/mobile/e2e/README.md, and E2E seed scripts run — a fresh
//     guest needs the API up to load real library content.
//   - iOS simulator booted with the Detox e2e-release build already installed
//     (apps/mobile: `pnpm test:detox:build:ios`).
//
// What it does:
//   1. xcrun simctl status_bar booted override ...   (clean status bar, matches pilot-03)
//   2. xcrun simctl io booted recordVideo --codec h264 <tmp raw file>
//   3. npx detox test -c ios.sim.release --reuse e2e/recordings/<flow>.e2e.js
//      (apps/mobile/e2e/recordings/jest.config.js; --reuse skips reinstall)
//   4. stop the recording (SIGINT), trim dead time, minterpolate 17fps -> 60fps
//   5. write apps/promo-video/public/recordings/<flow>.mp4
//
// Caveat (from README-short.md): minterpolate can very slightly ghost/smear the
// counter digits on interpolated frames — acceptable for a background shot.
import { spawn, execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMO_ROOT = path.resolve(__dirname, "..");
const MOBILE_ROOT = path.resolve(PROMO_ROOT, "../mobile");
const OUT_DIR = path.join(PROMO_ROOT, "public", "recordings");
const PILOTS_DIR = path.join(PROMO_ROOT, "pilots");

// Each spec's freshSignIn() deletes + reinstalls the app and runs the full onboarding +
// mock-Google-sign-in flow before the flow's own taps start — that lead-in is ~60-70s and
// varies run to run, so a fixed head offset (the original approach) cut into onboarding
// instead of the actual tap sequence. Trim from the END instead: grab the last
// `tailDuration` seconds of the raw capture, skipping `tailMargin` seconds right at the
// tail (recordVideo/detox teardown lag around the SIGINT).
const FLOWS = {
  counter: { tailDuration: 10, tailMargin: 0.5 },
  library: { tailDuration: 14, tailMargin: 0.5 },
  themes: { tailDuration: 14, tailMargin: 0.5 },
  // story-counter doesn't trim by a guessed tail window: its spec (a fresh guest, never
  // freshSignIn()) writes wall-clock beat markers to STORY_MARKERS_PATH, and this script
  // trims to those exact timestamps relative to when recordVideo started. See the
  // "story-counter" branch below.
  "story-counter": { markers: true, headMargin: 0.3, tailMargin: 0.5 },
  // story-vird / story-circle (video 2/3): same marker-based trim as story-counter, but
  // these specs sign in (freshSignIn(), premium seed) instead of staying a fresh guest —
  // run them with `--config ios.record` (see CONFIGS below) so the header shows "Ahmet",
  // never "E2E Kullanıcı".
  "story-vird": { markers: true, headMargin: 0.3, tailMargin: 0.5 },
  // tailMargin raised after a live capture: recordVideo's actual frame timeline can drift
  // ~4-5s behind wall-clock over a ~100s capture (worse than story-counter/-vird saw), so a
  // wall-clock-based trimEnd got clamped to the raw file's true end and lost the settled
  // "halka detayı" tail (verified via frame extraction — the clip ended mid-transition,
  // double-exposed). A bigger tailMargin alone doesn't fully fix it (see the spec's own
  // longer post-mark('C') dwell for the real fix) but gives more slack against the clamp.
  "story-circle": { markers: true, headMargin: 0.3, tailMargin: 3.0 },
};

// Detox configuration to build/run against. Defaults to the existing e2e-release config
// (unchanged behaviour); story-vird/story-circle pass `ios.sim.record` (apps/mobile/.detoxrc.js)
// so the mock-Google header reads "Ahmet" instead of the shared suite's "E2E Kullanıcı" —
// required because those two clips show a signed-in premium user on screen.
const CONFIGS = {
  counter: "ios.sim.release",
  library: "ios.sim.release",
  themes: "ios.sim.release",
  "story-counter": "ios.sim.release",
  "story-vird": "ios.sim.record",
  "story-circle": "ios.sim.record",
};

const flow = process.argv[2];
if (!flow || !FLOWS[flow]) {
  console.error(`Usage: node scripts/record.mjs <${Object.keys(FLOWS).join("|")}>`);
  process.exit(1);
}
const flowConfig = FLOWS[flow];
const detoxConfig = CONFIGS[flow];

function sh(cmd, args, opts = {}) {
  console.log(`$ ${cmd} ${args.join(" ")}`);
  execFileSync(cmd, args, { stdio: "inherit", ...opts });
}

mkdirSync(OUT_DIR, { recursive: true });
const tmpDir = path.join(PROMO_ROOT, ".tmp-recordings");
mkdirSync(tmpDir, { recursive: true });
const rawPath = path.join(tmpDir, `${flow}-raw.mp4`);
const trimmedPath = path.join(tmpDir, `${flow}-trimmed.mp4`);
const finalPath = path.join(OUT_DIR, `${flow}.mp4`);
if (existsSync(rawPath)) rmSync(rawPath);

// 1. Clean status bar (matches pilot-03's framing).
sh("xcrun", [
  "simctl", "status_bar", "booted", "override",
  "--time", "9:41", "--batteryState", "charged", "--batteryLevel", "100",
  "--cellularBars", "4", "--wifiBars", "3",
]);

// story-counter's spec writes wall-clock beat markers here (Date.now(), same host clock as
// this script) instead of us guessing a tail window.
const markersPath = path.join(tmpDir, "story-counter-markers.json");
if (flowConfig.markers && existsSync(markersPath)) rmSync(markersPath);

// 2. Start native video capture at the device's true pixel resolution. Capture the start
// timestamp right away — story-counter's trim math is relative to this instant.
const recordingStartMs = Date.now();
const recorder = spawn("xcrun", ["simctl", "io", "booted", "recordVideo", "--codec", "h264", rawPath], {
  stdio: "inherit",
});
await new Promise((r) => setTimeout(r, 1500)); // let recordVideo attach before the app starts moving

// 3. Drive the app via the matching Detox recording spec. --reuse: app already installed,
// don't reinstall/relaunch fresh (keeps the pre-onboarded guest session on screen; story-counter's
// own spec still does its own delete+reinstall for a truly fresh guest — see its comment).
try {
  sh(
    "npx",
    [
      "detox", "test",
      "-c", detoxConfig,
      "--config", "e2e/recordings/jest.config.js",
      "--reuse",
      `e2e/recordings/${flow}.e2e.js`,
    ],
    { cwd: MOBILE_ROOT, env: { ...process.env, STORY_MARKERS_PATH: markersPath } }
  );
} finally {
  // 4. Stop the recording.
  recorder.kill("SIGINT");
  await new Promise((r) => setTimeout(r, 1500)); // let ffmpeg finalize the mp4 container
}

if (!existsSync(rawPath)) {
  console.error(`No recording produced at ${rawPath} — did detox fail before any taps ran?`);
  process.exit(1);
}

const rawDuration = parseFloat(
  execFileSync("ffprobe", [
    "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", rawPath,
  ]).toString().trim()
);

let trimStart;
let trimDuration;
let markerRel; // (ms) => seconds relative to the trimmed clip's start — set below when flowConfig.markers
let beatsForPilot;

if (flowConfig.markers) {
  // 5a. Trim to the exact beat markers the spec wrote (ms, Date.now() on this same host
  // clock), not a guessed tail window.
  if (!existsSync(markersPath)) {
    console.error(`No markers written at ${markersPath} — did the story-counter spec run to completion?`);
    process.exit(1);
  }
  const { beats } = JSON.parse(readFileSync(markersPath, "utf8"));
  for (const key of ["A", "B", "C", "end"]) {
    if (typeof beats[key] !== "number") {
      console.error(`Missing beat marker "${key}" in ${markersPath}`);
      process.exit(1);
    }
  }
  const relSec = (ms) => (ms - recordingStartMs) / 1000;
  trimStart = Math.max(0, relSec(beats.A) - flowConfig.headMargin);
  const trimEnd = Math.min(rawDuration, relSec(beats.end) + flowConfig.tailMargin);
  trimDuration = trimEnd - trimStart;
  console.log(
    `Raw capture: ${rawDuration.toFixed(1)}s — beats A=${relSec(beats.A).toFixed(2)}s ` +
      `B=${relSec(beats.B).toFixed(2)}s C=${relSec(beats.C).toFixed(2)}s end=${relSec(beats.end).toFixed(2)}s ` +
      `— trimming to [${trimStart.toFixed(2)}, ${trimEnd.toFixed(2)}]s`
  );

  // Caption windows relative to the TRIMMED clip (what ShortVideo's captions[].from/to expect).
  // The pilot JSON is written after encoding (below), once we know the ENCODED clip's real
  // duration — the trim math above is only an estimate (recordVideo's own frame timestamps can
  // drift a second or two from our wall-clock markers over a ~50s+ capture).
  markerRel = (ms) => relSec(ms) - trimStart;
  beatsForPilot = beats;
} else {
  // 5b. Trim to the tail of the capture (the actual flow, after onboarding lead-in).
  const { tailDuration, tailMargin } = flowConfig;
  trimStart = Math.max(0, rawDuration - tailMargin - tailDuration);
  trimDuration = tailDuration;
  console.log(`Raw capture: ${rawDuration.toFixed(1)}s — trimming to [${trimStart.toFixed(1)}, ${(trimStart + tailDuration).toFixed(1)}]s`);
}

// 6. Trim, then smooth 17-18fps -> 60fps.
sh("ffmpeg", [
  "-y", "-ss", String(trimStart), "-i", rawPath, "-t", String(trimDuration),
  "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", "-preset", "veryfast",
  trimmedPath,
]);
// mi_mode=mci:mc_mode=aobmc:vsbmc=1 measured ~0.01x realtime at this resolution (1206x2622) —
// a ~50s clip would take over an hour. mi_mode=blend is the README's own documented fallback
// for exactly this (also side-steps the mci mode's digit-ghosting risk) and finishes in
// low single-digit minutes for clips this length.
sh("ffmpeg", [
  "-y", "-i", trimmedPath,
  "-vf", "minterpolate=fps=60:mi_mode=blend",
  "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", "-preset", "medium",
  finalPath,
]);

if (flowConfig.markers) {
  // Use the ENCODED clip's real duration (recordVideo's frame timestamps can drift a second
  // or two from our wall-clock beat markers over a long capture — ffprobe of the final file
  // is ground truth), and clamp the last caption to it so nothing spills past the video.
  const finalDuration = parseFloat(
    execFileSync("ffprobe", [
      "-v", "error", "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1", finalPath,
    ]).toString().trim()
  );
  console.log(
    `Beat offsets in the ENCODED clip (for hand-authoring the RichVideo-0N JSON's source ranges): ` +
      `A=${markerRel(beatsForPilot.A).toFixed(2)}s B=${markerRel(beatsForPilot.B).toFixed(2)}s ` +
      `C=${markerRel(beatsForPilot.C).toFixed(2)}s end=${Math.min(markerRel(beatsForPilot.end), finalDuration).toFixed(2)}s`
  );
}

// story-counter only: auto-writes the ShortVideo-style caption pilot (fixed copy/filename).
// story-vird/story-circle feed RichVideo-02/03 instead (per-scene source ranges + VO-driven
// timeline, see pilots/rich-02.json / rich-03.json) — those are hand-authored from the beat
// offsets logged above, not generated here.
if (flow === "story-counter" && flowConfig.markers) {
  const finalDuration = parseFloat(
    execFileSync("ffprobe", [
      "-v", "error", "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1", finalPath,
    ]).toString().trim()
  );
  const captions = [
    { text: "Zikrini seç", from: markerRel(beatsForPilot.A), to: markerRel(beatsForPilot.B) },
    { text: "Tek dokunuşla say, 33'te haber verir", from: markerRel(beatsForPilot.B), to: markerRel(beatsForPilot.C) },
    { text: "Kaldığın yerden devam", from: markerRel(beatsForPilot.C), to: Math.min(markerRel(beatsForPilot.end), finalDuration) },
  ];
  const pilotPath = path.join(PILOTS_DIR, "story-counter.json");
  const pilot = {
    hookText: "Zikir çekerken kaç kere sayıyı şaşırdın?",
    captions,
    recordingDurationSec: Math.round(finalDuration * 100) / 100,
    loop: false,
    outroSec: 4,
    sourceLine: "Kaynak: —",
    ctaText: "Google Play'de ücretsiz",
    appName: "Zikirmatik Asistan",
  };
  writeFileSync(pilotPath, JSON.stringify(pilot, null, 2) + "\n");
  console.log(`Wrote ${pilotPath} (recordingDurationSec=${pilot.recordingDurationSec})`);
}

console.log(`\nDone: ${finalPath}`);
