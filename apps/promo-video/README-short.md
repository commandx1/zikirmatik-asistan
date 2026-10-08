# Short marketing video (ShortVideo composition)

9:16, 1080x1920, 30fps, ~33s. Three beats: hook (0-3s) → body/screen recording (3-28s) → outro (28-33s).
Composition id: `ShortVideo`, defined in `src/ShortVideo.tsx`, registered in `src/Root.tsx`.

## Record a new clip

Use a **fresh guest** with real seeded library data, not leftover e2e test data (a fresh
install's guest header shows "Selam, Dostum", never an e2e user name / "Başlık 1" placeholder
dhikrs).

1. Test DB + real content (from repo root, then `apps/api`):
   ```sh
   pnpm db:test   # repo root, Docker Mongo on 127.0.0.1:27018
   cd apps/api && pnpm build
   NODE_ENV=development PORT=3000 \
     MONGODB_URI='mongodb://127.0.0.1:27018/zikir_e2e_mobile?directConnection=true' \
     AUTH_ALLOW_INSECURE_TEST_TOKENS=1 AUTH_ACCESS_TOKEN_SECRET=e2e-access AUTH_REFRESH_TOKEN_SECRET=e2e-refresh \
     AI_RUNTIME_MOCK=1 OPENAI_API_KEY=test-key SERVER_PUSH_ENABLED=0 APP_MIN_VERSION=0 \
     LOG_DRAIN_URL= LOG_DRAIN_TOKEN= SLACK_ALERT_WEBHOOK_URL= node dist/main &
   MONGODB_URI='mongodb://127.0.0.1:27018/zikir_e2e_mobile?directConnection=true' node scripts/e2e-seed.mjs --reset
   MONGODB_URI='mongodb://127.0.0.1:27018/zikir_e2e_mobile?directConnection=true' node scripts/seed-dhikrs.mjs
   MONGODB_URI='mongodb://127.0.0.1:27018/zikir_e2e_mobile?directConnection=true' node scripts/seed-vird-templates.mjs
   ```
2. Fresh install (clears AsyncStorage/onboarding state too):
   ```sh
   xcrun simctl uninstall booted com.zikirmatik_asistan.app
   xcrun simctl install booted apps/mobile/ios/build/Build/Products/Release-iphonesimulator/ZikirmatikRehber.app
   xcrun simctl status_bar booted override --time 9:41 --batteryState charged --batteryLevel 100 --cellularBars 4 --wifiBars 3
   xcrun simctl launch booted com.zikirmatik_asistan.app
   ```
3. Dismiss the notification permission dialog and the 9-step onboarding tour. **The tour's
   Pressables did not respond to synthetic taps in testing** (`CGEventPost` and AppleScript
   `click at` both landed correctly per accessibility bounds but the RN `Modal`-based tour overlay
   never advanced) — fastest fix: terminate the app, patch
   `~/Library/.../Containers/Data/Application/<uuid>/Library/Application Support/com.zikirmatik_asistan.app/RCTAsyncLocalStorage_V1/manifest.json`,
   setting `onboarding-store-v4` to `{"state":{"purpose":"habit","isTourCompleted":true},"version":0}`,
   then relaunch. The post-tour "Hoş geldin" bottom sheet (`Sonra bak`) and everything else on the
   home screen taps normally.
4. Pick a real dhikr: bottom nav "•••" → **Koleksiyonlar**, or scroll the home screen's
   **ESMAÜL HÜSNA** list and tap a name (e.g. El-Kuddüs) — this starts the counter on it with real
   Arabic + Turkish meaning shown below the card.
5. **Coordinate mapping** (important — do not assume window-frame proportions): query the
   simulator's actual content view bounds, not the outer window:
   ```applescript
   tell application "System Events" to tell process "Simulator" to get {position, size} of group 1 of window 1
   ```
   This returns the **content** origin/size in points (e.g. `3313, 139, 402, 874`), which is a
   `1:1` mapping to on-screen points once you exclude the title bar and device bezel — the naive
   `window position/size` includes ~80pt of title bar and ~27pt of side bezel and will silently
   miss small targets (it happened to work for the giant counter tap zone but missed every button
   in the tour and welcome sheet). Convert a target pixel `(px, py)` from a `simctl io screenshot`
   (1206x2622 for this device) to a click point with:
   `screenX = contentX + (px / screenshotWidth) * contentWidth`,
   `screenY = contentY + (py / screenshotHeight) * contentHeight`.
6. Record. Two capture paths were tried:
   - **avfoundation screen capture** (`ffmpeg -f avfoundation -framerate 60 -i "<screen index>"`,
     cropped to the device content rect) gives a real 60fps capture, but on a machine where the
     Simulator window sits on a **non-Retina external monitor**, the backing pixel density is
     capped at that monitor's native (1x) resolution — the device content comes out ~402x874px
     (upscaled ~2.7x by Remotion, visibly soft text). Only worth using if the Simulator window is
     on a Retina display and you verify the cropped output is ≥900px wide with `ffprobe` before
     trusting it.
   - **`simctl io booted recordVideo`** (used for the final pilot) always captures at the
     simulator's true device pixel resolution (1206x2622 for this device) regardless of monitor,
     but its native frame rate is a choppy ~17-18fps. Smooth it after the fact:
     ```sh
     xcrun simctl io booted recordVideo --codec h264 raw.mp4   # kill -INT <pid> to stop
     ffmpeg -ss 1.5 -i raw.mp4 -t 12 -an -c:v libx264 -pix_fmt yuv420p -crf 16 -preset veryfast trimmed.mp4
     ffmpeg -i trimmed.mp4 -vf "minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:vsbmc=1" \
       -an -c:v libx264 -pix_fmt yuv420p -crf 16 -preset medium public/recordings/<name>.mp4
     ```
     `minterpolate` is slow at this resolution (~2-3 min for a 10-12s clip) and can very slightly
     ghost/smear fast-changing text (the counter digits) on interpolated frames — acceptable for a
     background product shot, worth a second look if the counter number itself becomes a focal
     point later.
7. Perform ~12 unhurried taps on the counter (`~0.8s` apart) using the Quartz click script below,
   before stopping the recording.
   ```python
   import sys, Quartz, time
   x, y = float(sys.argv[1]), float(sys.argv[2])
   down = Quartz.CGEventCreateMouseEvent(None, Quartz.kCGEventLeftMouseDown, (x, y), Quartz.kCGMouseButtonLeft)
   up = Quartz.CGEventCreateMouseEvent(None, Quartz.kCGEventLeftMouseUp, (x, y), Quartz.kCGMouseButtonLeft)
   Quartz.CGEventPost(Quartz.kCGHIDEventTap, down); time.sleep(0.05)
   Quartz.CGEventPost(Quartz.kCGHIDEventTap, up)
   ```
8. Tear down: `kill` the API process, then `pnpm db:test:down` from the repo root (only once
   nothing else — e.g. a Detox run — still needs the shared test DB).

If `recordingLoopFrames` needs updating for a new clip length, it's `round(clipDurationSeconds * 30)`
(the `Loop` component's `durationInFrames` is in the **composition's** fps, not the source clip's).

## Change props

`ShortVideo` props (all optional, see `ShortVideoProps` in `src/ShortVideo.tsx`):

- `hookText` — hook beat headline (placeholder only; real copy added later).
- `captions` — `{ text, startSec, durationSec }[]`, seconds relative to the body beat start.
- `recordingSrc` — `staticFile("recordings/<name>.mp4")`.
- `recordingLoopFrames` — length of that clip in frames (30fps); the body beat loops it.
- `sourceLine`, `ctaText`, `appName`, `appIconSrc`.

Edit `defaultProps` on the `ShortVideo` composition in `src/Root.tsx` for the sample, or pass
props via `remotion render ShortVideo out.mp4 --props='{"hookText":"..."}'`.

## Render

```
npx remotion render ShortVideo out/short-pilot-03.mp4 --codec=h264
```

(`npm run render` renders the original `ZikirmatikPromo` composition — unchanged.)

## Sesli sürüm (Video 1, `RichVideo-01`)

Composition `RichVideo-01` (`src/RichVideo.tsx`, registered in `src/Root.tsx`) is Video 1
driven by the 5-sentence voice-over instead of caption-driven beat markers. The timeline is
computed from `public/audio/vo-01.json` at import time (`richVideoDurationInFrames`) — no
frame numbers are hardcoded, so re-running the TTS step and re-rendering reflows everything.

### Re-render

```
npx remotion render RichVideo-01 out/video-01-sesli.mp4 --codec=h264
```

Checks after a render:
```
ffprobe -v error -show_entries stream=codec_type -of default=noprint_wrappers=1 out/video-01-sesli.mp4   # expect an audio stream
ffmpeg -i out/video-01-sesli.mp4 -af volumedetect -f null -    # mean_volume, aim ~-20 to -22dB
```
If the VO reads quiet, raise the `volume` prop on the five `<Audio>` tags in `RichVideo.tsx`
(currently `1.8`) — don't push past where `max_volume` approaches 0dB (clipping).

### AI Rehber klibi (2026-09-28, landed)

Scene 2b (the "asistana sor" half of sentence 2) now plays the real recording,
`public/recordings/ai-rehber.mp4` (Android emulator, prod app, 1080x2400, 60fps container /
sparse real frames, 31.8s). `AI_REHBER_AVAILABLE = true` in `src/RichVideo.tsx`; the old
placeholder (`AiRehberSlot`, no video) stays as the fallback path for `false`.

**How it was recorded:** `scripts/record-ai-android.sh` (adb `input tap`/`input text` beats +
`screenrecord`, prints wall-clock beat markers). Prerequisites: a booted emulator on the
`android.emu.prod` Detox build (real prod API, real signed-in Google account — not an
e2e/guest session, so credit balances etc. read real), Turkish locale, and `sysui` demo mode
for a clean status bar (steps + exact `adb`/broadcast commands are in the script's header
comment). Tap coordinates are calibrated for the 1080x2400 skin used here — recalibrate for a
different emulator resolution.

**Content timeline of the raw clip** (verified frame-by-frame with `ffprobe`/`ffmpeg`, not
just the nominal 60fps — the capture's real distinct frames are much sparser, ~6-15fps,
duplicated up to 60fps by the container): 0–1.5s idle (personal "Son Asistan Aramaları"
history visible — never used in the cut); ~2–4.75s the intention "sabah yolda huzur bulmak"
typed + sent (transition to the loading skeleton happens abruptly, between real frames at
~4.72s and ~4.79s — the history reappears above the skeleton the instant it does); ~4.75–25s
"Asistan çalışıyor" skeleton (history still on screen); ~25s results land; two slow swipes
from ~25–27s scroll the history out of view and settle on the primary recommendation card
("Yâ Mü'min", Arapça/Okunuş/Anlam/Fazilet) by ~27.7s, which then stays legible (with a little
continued drift — KAYNAK/"Başla" scroll into view) through the clip's end at 31.8s.

**Scene 2b's two source windows** (`AI_REHBER_A_FROM/A_TO`, `AI_REHBER_B_FROM` in
`RichVideo.tsx`, both `rate: 1.0` — never ramp this clip, non-1x rates on `OffthreadVideo`
reproducibly blank frames, see the `RELAUNCH_*` comment above it), joined by a 0.25s
dark-overlay crossfade (`AiRehberSplit`, reusing `DarkOverlay` from Scene4's relaunch):
- **A** 3.15s→4.75s (~1.6s): typing mid-sentence through the send tap, cut right before the
  post-send/history screen becomes visible.
- **B** 27.7s→~31.2s (real window stretches to fill whatever of scene 2b's own time budget is
  left after A + the crossfade, since that budget shifts slightly with `vo-01.json`'s audio
  duration): the settled "Yâ Mü'min" card, history-free.

If `vo-01.json`'s sentence 2 changes enough that `AI_REHBER_A_TO - AI_REHBER_A_FROM` no longer
fits inside the new scene-2b budget, shorten `AI_REHBER_A_TO` first (per the brief) rather than
touching B's start.

QA on the 2026-09-28 render (`out/video-01-sesli.mp4`, 721 frames / 24.085s, regression-clean):
0.25s brightness sweep across all of scene 2 (3.57–10.77s) found no blank/near-black frames;
spot-checked frames confirm the typed intention is readable in A, the crossfade lands cleanly,
and the Yâ Mü'min card's Arapça/Okunuş/Anlam/Fazilet are all readable in B with no history text
anywhere; `ffprobe` confirms an audio stream.

### Switching the VO voice

`scripts/tts.mjs` (no CLI flags) re-runs the full ElevenLabs pipeline:
1. Fetches your ElevenLabs voice list, ranks candidates by label text (favors
   calm/warm/narration-y labels, penalizes excited/hype ones — see `pickCandidates`), and
   picks the top-ranked one automatically — there's no `--voice` flag to force a specific
   voice. To pin a specific voice, hardcode its `voice_id` in place of `candidates[0]` in
   `main()`, or edit `pickCandidates`'s scoring.
2. Synthesizes all 5 `SENTENCES` (hardcoded in the script, must stay in sync with the brief's
   copy) with that voice, sentence 2 via the `with-timestamps` endpoint to find the 2a/2b
   split (`SPLIT_MARKER = "ister asistana"`).
3. Writes `public/audio/vo-01-s<N>.mp3` and the manifest `public/audio/vo-01.json`
   (voice name/id, per-sentence text/file/durationSec, sentence 2's `splitAtSec`).

Run with `node scripts/tts.mjs` from `apps/promo-video/` (reads `ELEVENLABS_API_KEY` from
`.env`, never logs it). Re-rendering `RichVideo-01` afterwards picks up the new audio and
durations automatically — no manual timeline edits.

## Bilinen pürüz (2026-09-25)

minterpolate ile 17→60 fps yumuşatma, hızlı değişen sayaç rakamında hafif hayalet bırakır. Rakam odak noktasıysa `mi_mode=blend` dene ya da interpolasyonsuz 30 fps kullan; en iyi çözüm Retina ekranda %100 ölçekli Simulator penceresini avfoundation ile yakalamaktır.

## Scripted recording pipeline (pilot 04+)

`scripts/record.mjs <flow>` (flow: `counter` | `library` | `themes`) automates the capture
loop for a single flow: status bar override → `simctl io booted recordVideo` → the matching
Detox spec in `apps/mobile/e2e/recordings/<flow>.e2e.js` (run with `--reuse` so the app isn't
reinstalled) → stop the recording → trim dead time → `minterpolate` 60fps smoothing →
`public/recordings/<flow>.mp4`.

Prerequisites (same as the manual pipeline above):
- Docker Desktop running; from repo root `pnpm db:test`, then from `apps/api`: `pnpm build`
  (skip if `dist/` is fresh) and run `node dist/main` with the env block from
  `apps/mobile/e2e/README.md`, plus `MONGODB_URI=<same> pnpm seed:e2e` (or the individual
  `scripts/e2e-seed.mjs --reset` / `scripts/seed-dhikrs.mjs` / `scripts/seed-collections.mjs` /
  `scripts/seed-vird-templates.mjs`, in that order — collections must be seeded **after**
  dhikrs or the dhikr-key match comes back 0/541) for the full library.
- The e2e-release build already installed on the booted simulator
  (`apps/mobile`: `pnpm test:detox:build:ios`).
- Tear down the same way as the manual flow: kill the API process, then `pnpm db:test:down`.

Recording specs live in `apps/mobile/e2e/recordings/*.e2e.js` and are deliberately excluded
from the normal suite (`apps/mobile/e2e/jest.config.js` has
`testPathIgnorePatterns: ['<rootDir>/e2e/recordings/']`; verify with
`npx detox test -c ios.sim.release --listTests` from `apps/mobile`, which must NOT list
anything under `e2e/recordings/`). They run through their own
`apps/mobile/e2e/recordings/jest.config.js`.

**Update (2026-09-25, all three flows verified live):** `collection-card.tsx`'s Pressable,
`collection-category-filter.tsx`'s filter chips, the collection-detail "Sayaca Ekle" button and
its `ScrollView`, and `theme-grid-section.tsx`'s theme swatches (plus the theme selector's
`PageScrollView`) now carry testIDs (`TEST_IDS.collections.*`, `TEST_IDS.theme.*` in
`src/test-ids.ts`) — additive only, no behaviour change. All three specs
(`counter.e2e.js`/`library.e2e.js`/`themes.e2e.js`) now run end to end against a live simulator
via `node scripts/record.mjs <flow>` and produce a valid `public/recordings/<flow>.mp4`
(1206x2622, 60fps). What it took to get there:

- **`e2e/global-setup.js` never seeded collections.** It reset the DB and seeded dhikrs + vird
  templates on every run (including every `record.mjs` invocation, which shares this global
  setup) but never called `seed-collections.mjs` — so `library.e2e.js` always saw an empty
  collections list. Fixed by adding the `seed-collections.mjs` call (after dhikrs, per the seed
  order below).
- **`useCollections`/`useCollectionDetail`'s `useFocusEffect` had `[query]` in its deps array.**
  `useQuery`'s returned object gets a new identity on every render, so the effect re-ran on
  *every* render, not just on focus — an infinite `refetch()` loop (5600+ requests logged in a
  few seconds) that pegs the JS thread and makes the app fully unresponsive to Detox taps
  ("the app has not responded to the network requests"). Fixed by depending on `query.refetch`
  instead (stable across renders) in both hooks — a real bug independent of this task, not just
  a recording-pipeline issue.
- **`record.mjs`'s fixed head-trim (`-ss 1.5 -t 10`) was wrong for `--reuse` specs that call
  `freshSignIn()`.** `freshSignIn()` deletes + reinstalls the app and runs the full onboarding +
  mock-sign-in flow (~35-70s, varies) *before* a flow's own taps start, so a small fixed offset
  from the head of the raw capture only ever showed onboarding, never the flow. Rewrote the trim
  step to probe the raw capture's duration with `ffprobe` and grab the last `tailDuration`
  seconds instead (see `FLOWS` in `record.mjs`).
- **Detox's `.scroll(pixels, direction)` does not reliably travel the requested distance in one
  gesture** (observed anywhere from ~100px to overshooting an entire 19-item grid for the same
  `600` argument, run to run) — don't use a fixed pixel guess. Use
  `waitFor(target).toBeVisible(100).whileElement(scrollId).scroll(...)` instead, which stops
  exactly when the target clears Detox's tap-hittable (100%) visibility threshold; `toBeVisible()`
  with no argument only requires 75%, which is enough to resolve the `waitFor` but not enough to
  `.tap()`.
- **The theme selector re-scrolls itself.** `theme-selector/screen.tsx`'s `handleSelectTheme`
  calls `scrollRef.current?.scrollTo({ y: 70 })` after every selection (to bring the preview card
  into view) — so a spec that taps several swatches in sequence must re-scroll to each one, not
  scroll once before the loop.
- The mock-Google `freshSignIn()` helper shared with the functional e2e suite signs into the
  seeded **E2E test account** ("Selam, E2E Kullanıcı") and starts from whatever dhikr that
  account's home screen defaults to (a placeholder "Başlık 1" custom dhikr in the counter flow) —
  not the fresh-guest, real-content session the manual Quartz pilots used. The library and theme
  clips show real seeded collection/dhikr content once navigated to; the counter clip's *starting*
  screen does not. Rebuilding a guest-only recording helper was out of scope here; flagging it so
  the counter clip's fidelity is a deliberate, known trade-off rather than a surprise.
- `counter.mp4` ends up short (~6s against a 10s target): `freshSignIn()`'s lead-in eats nearly
  all of the ~75s raw capture, leaving less than the requested tail window before the recording
  is stopped. Fine for a background loop; increase `TAP_COUNT`/`TAP_DELAY_MS` in
  `counter.e2e.js` if more raw footage is needed.

Earlier finding, from the manual-pilot session, still relevant for any future manual capture:
`xcrun simctl openurl booted "zikirmatik://theme-selector"` (deep link, scheme from `app.json`)
is a much more reliable way to reach a screen than chasing a flaky bottom-tab "more" popover.

## Sesli sürüm, Video 2 ("Vird") ve Video 3 ("Halka") — JSON-driven RichVideo

`RichVideo-02`/`RichVideo-03` (compositions in `src/Root.tsx`) are driven by
`src/RichVideoGeneric.tsx`, a generic scene renderer, NOT a copy of `RichVideo01`'s bespoke
Scene2/3/4 (`src/RichVideo.tsx`) — that file's own scenes (AI Rehber split, dark-overlay
relaunch trick) are untouched; `RichVideoGeneric` only reuses its side-effect-free exports
(`buildTimelineFor`, `HookScene`, `BrandOutroScene`, `RampedClipFrom`, `CaptionPill`,
`PhoneStage`). Re-rendering `RichVideo-01` after this change reproduces the exact same
24.09s ±0.1 duration (regression-checked) — see `pilots/rich-02.json` / `rich-03.json` for a
live example of the schema below.

### `pilots/rich-0N.json` schema

```jsonc
{
  "recordingSrc": "recordings/story-vird.mp4",   // one recording for scenes 2-4
  "scenes": [                                     // exactly 3: scene2, scene3, scene4
    {
      // Video segments, speed-ramped to fill the scene's audio-driven output time
      // (sentence audio + 0.35s gap). At most one "ramp" segment per scene (fills
      // whatever output time the "fixed" segments don't use); any number of "fixed"
      // segments (fixed REAL seconds window at an explicit `rate`, >= 0.56x — the
      // OffthreadVideo blank-frame floor, see "Bilinen pürüz" above).
      "segments": [
        { "kind": "ramp", "from": 0.3, "to": 7.0 },
        { "kind": "fixed", "from": 7.0, "to": 8.6, "rate": 0.75 }
      ],
      // Optional: a small gold pulse label over a specific segment (e.g. "Sonraki").
      "badge": { "text": "Sonraki", "segmentIndex": 1, "atFrame": 4, "durationFrames": 24 }
    },
    { "segments": [ /* ... */ ] },
    {
      // OR: a single static image filling the whole scene instead of segments (the same
      // "static frame" trick RichVideo01 uses for its own relaunch payoff) — for when the
      // live recording's tail didn't survive (see the story-circle finding below).
      "staticImage": "recordings/circle-detail-settled.png"
    }
  ]
}
```

`from`/`to` are **absolute seconds within `recordingSrc`**, not scene-relative. The VO
manifest (`public/audio/vo-0N.json`) is imported separately in `Root.tsx` and passed in as
`voManifest` — it drives the timeline (scene lengths, lead-in, hold) exactly like vo-01 does
for `RichVideo-01`.

### `scripts/record.mjs`: new flows + selectable Detox config

- New flows `story-vird` / `story-circle` (same marker-based trim + `minterpolate=blend`
  pipeline as `story-counter`), writing `public/recordings/story-vird.mp4` /
  `story-circle.mp4` at 1206x2622. Their beat offsets (A/B/C/end, printed after each run) are
  for hand-authoring the `pilots/rich-0N.json` source ranges above — record.mjs does NOT
  auto-generate those two videos' pilot JSON the way it does `pilots/story-counter.json`
  (different composition shape, no fixed caption text to bake in).
- The Detox config to build/run against is now selectable per flow (`CONFIGS` map in
  `record.mjs`) — `story-vird`/`story-circle` use `ios.sim.record`
  (`apps/mobile/.detoxrc.js`), a near-duplicate of `ios.sim.release`/`ios.release` that only
  changes the mock-Google display name/email (`EXPO_PUBLIC_DEV_GOOGLE_NAME="Ahmet"`,
  `EXPO_PUBLIC_DEV_GOOGLE_EMAIL=ahmet@example.com`) and uses a separate derivedData path
  (`ios/build-record`) so it doesn't clobber the shared e2e-release binary. These two flows
  need a **signed-in premium user on screen** (vird programs, circle detail), and the header
  must never show "E2E Kullanıcı" — build with `npx detox build -c ios.sim.record` first.

### `apps/mobile/e2e/recordings/story-vird.e2e.js` / `story-circle.e2e.js`

Same shape as `story-counter.e2e.js` (testID-only, beat markers `{A,B,C,end}` via
`STORY_MARKERS_PATH`, excluded from the normal suite — verified with
`npx detox test -c ios.sim.release --listTests`), but sign in for real
(`freshSignIn()` + `seed('--premium e2e-user')` + `relaunch()`) instead of staying a fresh
guest. `story-circle.e2e.js` also does a cheap bonus: a second member joins via a raw
`fetch()` to `/v1/auth/provider/verify` + `/v1/circles/join` with a different mock-auth
`sub` (`e2e-user-2`) — no second Detox device needed, the members list just shows two people.

**Findings from live recording (2026-09-27):**
- **`goNext()` (the vird session's "Sonraki"/"Atla" transition) never marks an item
  completed** — it only advances `currentIndex`. Repeatedly skipping ("Atla") through a
  template's real dataset therefore can NEVER reach the "day completed" banner: eventually
  `pickNextIndex` returns the item after the last incomplete one, at which point neither
  "Sonraki" nor "Atla" render (both require `nextIndex != null`) and the session is stuck.
  Verified twice live (first attempt hit jest's 180s test timeout; second hit the explicit
  10s wait for `e2e-vird-session-finish`). `story-vird.e2e.js` deliberately does NOT chase
  day-completion: it does real counting + one real "Sonraki" transition (item 2, a
  small-target item) + a few "Atla" skips, then closes the session screen directly. A
  `sessionSkip` testID (`e2e-vird-session-skip`) was added to `vird-session-screen.tsx` for
  this — it had none.
- **`simctl io recordVideo` loses ~5-8s off the tail of a capture after SIGINT**, and the
  loss is NOT proportional to how long you pad with an in-app dwell afterward — padding the
  dwell just pushes MORE of that same loss into the dwell, not past it, unless the total
  capture is long enough that the target content has several genuine seconds of real
  capture-time buffer after it (confirmed across 5 live attempts: 0s/4s/6s/8s dwells all lost
  the same ~5s window; only shortening everything BEFORE the target content and using a
  moderate dwell reliably worked for `story-vird`). For `story-circle`, the settled
  "halka detayı" screen (members + progress) still didn't survive in the video even after
  that fix — so the spec grabs it as a **plain `simctl io booted screenshot`** instead (fully
  decoupled from `recordVideo`'s finalization behaviour) and `RichVideoGeneric.tsx`'s new
  `staticImage` scene type renders it, the same static-frame trick `RichVideo01` already uses
  for its own relaunch payoff (`SettledImage`).
- Minor additive testIDs needed across vird/circle screens that had none (template picking,
  template start, reminder settings scroll target, circle session start/close/counter) — see
  `src/test-ids.ts` comments for the full list; all additive, mobile typecheck clean.

### Render + QA (2026-09-27, second pass — both passed)

```
npx remotion render RichVideo-02 out/video-02-vird-sesli.mp4 --codec=h264
npx remotion render RichVideo-03 out/video-03-halka-sesli.mp4 --codec=h264
```

A coordinator review of the first-pass renders found three real issues, all fixed and
re-verified live (not just theorized):

1. **A genuine blank phone frame** in video-03 scene 2, inside a `rate: 0.75` "fixed" payoff
   segment — confirmed via a systematic 0.25s brightness sweep (not the earlier, too-coarse
   1.5s check). Root cause: the same `OffthreadVideo` blank-frame bug `RichVideo01` already
   works around (see "Bilinen pürüz" above) — **any non-1.0 rate is a risk**, not just very
   slow ones. Fix: every "fixed" payoff segment in both `pilots/rich-0N.json` now uses
   `rate: 1.0` (verified against the actual footage that a clean real-speed window exists at
   each payoff point); ramps stay sped-up (rate > 1, which never showed this bug in any test).
2. **Wrong dhikr** in video-03 ("Camiden çıkarken İblis'ten Sığınma", picked by blind
   `atIndex(0)`) — `story-circle.e2e.js` now uses the picker's search field (added a
   `pickerSearch` testID, `vird-dhikr-picker-modal.tsx`) to filter to a Salavat item
   ("salli" — the word "salavat" itself never appears in salavat.mjs's transliterations, so
   that would have matched nothing) before picking. Getting this reliable took several live
   iterations: `typeText`'s keystroke simulation raced with the sheet's mount/keyboard
   animation and sometimes typed nothing or a truncated string — switched to `replaceText`
   (atomic, no keystroke race); the modal auto-closes on a successful pick (no separate
   "Bitti" tap needed — added one once, it fired on an already-closed sheet and made things
   worse); and on this machine, under concurrent Docker/API/Xcode load, plain
   `waitFor(...).toBeVisible()` calls sometimes timed out even though the screen was already
   correct (confirmed from the recording) — replaced with a retry-the-tap loop
   (`tapAtIndexWhenHittable`, same pattern as `story-counter.e2e.js`) instead of trusting a
   single visibility assertion.
3. **Video-02 scene 4 cropped** — `story-vird.e2e.js`'s `scrollTo()` stopped as soon as the
   reminder card cleared Detox's 75% visibility default, which (since the card is taller than
   one screen) left its bottom half off-frame. Added one explicit follow-up `.scroll(220,
   'down')` and an extended hold (3800ms — an earlier 2500ms attempt left only ~1.4s of
   fully-settled card before the clip's natural end, not enough for the scene's ~2.16s output
   budget at real speed).

("Video-02 outro is 7.2s" from the first-pass report was **not a real bug** — a transcription
error in that report's own timeline table. Frame-accurate re-verification (0.1s steps around
the scene boundary) confirms scene 4→5 lands within a few frames of `buildTimelineFor`'s own
math for both videos; see the corrected timelines below.)

**Corrected per-scene timelines** (composition time; both re-recorded, so absolute source
timestamps shifted slightly from the first pass — see `pilots/rich-02.json` / `rich-03.json`
for the exact values used):

Video 2 ("Vird"), 22.912s total:
| Scene | Composition | Source (story-vird.mp4) |
|---|---|---|
| 1 hook | 0–3.13s | kinetic text |
| 2 | 3.13–8.64s | ramp [0.30,7.30] → fixed [7.30,9.30]@1.0 (template-start payoff) |
| 3 | 8.64–13.49s | ramp [10.85,27.0] → fixed [27.0,29.0]@1.0 (real "Sonraki", badge) |
| 4 | 13.49–15.65s | fixed [43.9,46.05]@1.0 (full reminder card, settled) |
| 5 outro | 15.65–22.91s | static brand card |

Video 3 ("Halka"), 22.357s total:
| Scene | Composition | Source (story-circle.mp4) |
|---|---|---|
| 1 hook | 0–3.92s | kinetic text |
| 2 | 3.92–8.64s | ramp [0.30,22.5] → fixed [22.5,24.5]@1.0 (invite-code payoff) |
| 3 | 8.64–13.44s | fixed [26.8,31.608]@1.0 (near-real-speed rising total) |
| 4 | 13.44–15.60s | static image `circle-detail-settled.png` |
| 5 outro | 15.60–22.36s | static brand card |

QA (2026-09-27, this pass):
- ffprobe: both have an audio (aac) + video (h264, 1080x1920) stream.
- `ffmpeg -af volumedetect`: video-02 mean -22.3dB / max -1.5dB; video-03 mean -22.0dB / max
  -0.3dB — both on target, no clipping.
- **0.25s blank-frame sweep across the FULL length of both videos** (`fps=4` extraction,
  91 + 89 frames, mean-brightness check on the phone region): zero flagged frames in either
  video.
- Spot-checked every scene's payoff frame in both videos: no "E2E" text anywhere (header
  reads "Ahmet" throughout), captions match the VO sentence per scene, all payoffs read
  clearly at real speed (template-start toast, real "Sonraki" transition, invite code + 2
  members "Ahmet"/"Fatma", rising total, full reminder card, brand outro).
- Known, pre-existing limitation (unchanged from the "Bilinen pürüz" note above): mild
  `minterpolate` ghosting/double-exposure on fast ramp segments and on residual scroll
  settling — cosmetic only, not a blank frame.

Scripted-vs-manual comparison renders (same `ShortVideo` component, baked `defaultProps` per
composition — `--props` CLI overrides break this bundle's static-file route, see the comment in
`src/Root.tsx`):

```
npx remotion render ShortVideo-counter-scripted out/short-pilot-03-scripted.mp4 --codec=h264
npx remotion render ShortVideo-pilot-04 out/short-pilot-04-scripted.mp4 --codec=h264
npx remotion render ShortVideo-pilot-05 out/short-pilot-05-scripted.mp4 --codec=h264
```

`ShortVideo-pilot-04`/`-05` already point `recordingSrc` at `recordings/library.mp4` /
`recordings/themes.mp4`, so re-running the scripted pipeline and re-rendering those two ids is
enough to pick up new footage. Counter is different: the base `ShortVideo` composition's default
`recordingSrc` is the manual `recordings/counter-pilot.mp4` pilot, kept as-is on purpose so the
two remain independently comparable — `ShortVideo-counter-scripted` is a new composition id with
the same props pointed at the scripted `recordings/counter.mp4` instead.

## Sesli sürüm, Video 4 ("AI Rehber", Instagram Reels) — `RichVideo-04` (2026-10-06)

Mesaj: "yarın sınavım var, çok kaygılıyım" niyeti → AI Rehber kaynaklı öneri kartı → Başla → sayaç.
VO `node scripts/tts.mjs 04` (vo-04, George). Render:
`npx remotion render RichVideo-04 out/video-04-ai-rehber-sesli.mp4 --codec=h264`, kapak
`npx remotion still RichVideo-04-cover out/video-04-kapak.png`, paylaşım metni `out/video-04-instagram.txt`.

**Kayıt (gerçek Android telefon, prod Play sürümü):** gerçek AI cevabı yalnız prod'dan gelir.
- `export ANDROID_SERIAL=<adb devices>`; ADBKeyBoard IME (Türkçe harf: `adb input text` ı/ç yazamaz),
  DND açık. One UI sysui demo mode'u yok sayar → durum çubuğu/nav bar kompozisyonda maskelenir
  (`maskTopPx`/`maskBottomPx`), kişisel satırlar `maskRects` ile.
- `scripts/record-ai-rehber-04.sh`: yazma → gönder → cevap (60 sn üst sınır) → kart → KAYNAK. 1 kredi.
- `scripts/record-ai-rehber-04-counter.sh`: sahne 4 ayrı kısa kayıt — sonucu "Son Asistan
  Aramaları"ndan aç (AI çağırmaz, kart birebir aynı) → Başla → sayaç. Önce ana sayacı nötr yap
  ("Serbest Mod" etiketine dokun: seçili zikir yok, sayaç 0); aksi hâlde "Kaydedilmemiş zikir var"
  (0 çekimde bile) ya da "Nasıl devam etmek istersin?" diyaloğu çıkar.
- Telefon kayıtları değişken kare hızlı (~120 Hz) → kompozisyon `-cfr.mp4` (60 fps) kopyalarını kullanır.

**Tuzaklar:** AI çıktısı aynı niyette bile çekimden çekime değişir — her çekimin kartı yeniden
onaylanır. "Son Asistan Aramaları" yazma ekranında görünür (kişisel) → sahne 2 niyet kutusuna
yakınlaştırılıp altı soldurulur. Reels güvenli alanı: altyazı `captionBottom: 400` (alt ~380 px
ve sağ ~120 px IG arayüzü). Generic sahnede tek `PhoneStage` (segment başına değil) — aksi
hâlde intro slide her segment sınırında yeniden oynar.

## Sesli sürüm, Video 5 ("AI Sohbet — kaynaklı cevap", Instagram Reels) — `RichVideo-05` (2026-10-08)

Mesaj: "Su yoksa abdest nasıl alınır?" → AI Sohbet'e sor → kaynak taranır → cevap kitap + sayfa ile.
VO `node scripts/tts.mjs 05` (vo-05). Render: `npx remotion render RichVideo-05 out/video-05-ai-sohbet-sesli.mp4 --codec=h264`,
kapak `npx remotion still RichVideo-05-cover out/video-05-kapak.png`, metin `out/video-05-instagram.txt`.
Config `pilots/rich-05.json`; yeni opsiyonel sahne alanı `sourceCard` (RichVideoGeneric: `lines`, `atFrame`,
`highlight` kaynak px) — altın vurgu kutusu + 7 kare arayla beliren kaynak kartı. Varsayılanlar değişmedi.
Kapak için `public/recordings/ai-chat-05-settled.png` (cfr 30 sn karesinden kırpma).

Kayıt (`public/recordings/ai-chat-05-cfr.mp4`, gerçek Samsung, prod): 0–2 boş sohbet, 2–8.8 soru yazma, ~11.6
gönder, 15–22.5 "Kaynaklar taranıyor...", 22.8–26 akış, 26–33 yerleşik cevap + 3 kaynak satırı. 1 kredi.
Kayıt betiği: `scripts/record-ai-chat-05.sh` (yazma → gönder → cevap → bekle).

Tuzaklar: "Son Sohbetler" geçmişi (y 300–813) kişisel — hiçbir karede okunmamalı; pencere kaynak y>850'den
başlar (phone top -779, scale 1.35) ve geçmiş cevap akarken ~25-26 sn'de kayana dek görünür kalır (akış penceresi
23.2–24.4). Yazma sırasında "ADB Keyboard" şeridi (y~2140) → `fadeBottom [1400,1420]` ile gizli; nav bar
`maskBottomPx`. Sahne 4: sabit 27.0–31.3 @1.0, zoom 1.4, kaynak kartı kanvasta y~905; `holdAfterSec: 1.6` (sahne başına opsiyonel sessiz bekleme, sonraki sahneleri öteler) kartı >=2.8 sn tutar. IG üst ~260 px kapalı: sahne 3 phone top -503 + history `maskRects` (y100–850).
