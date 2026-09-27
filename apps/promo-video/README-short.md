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

### Dropping in the AI Rehber clip

Scene 2b (the "asistana sor" half of sentence 2) shows a placeholder (`AiRehberSlot` in
`RichVideo.tsx`) until `public/recordings/ai-rehber.mp4` exists. Once you've recorded it:
1. Save it to `public/recordings/ai-rehber.mp4`.
2. In `src/RichVideo.tsx`, flip `const AI_REHBER_AVAILABLE = false;` to `true`.
3. Re-render. `AiRehberSlot` already fits/letterboxes (`objectFit: "contain"`) whatever aspect
   ratio the clip turns out to be, no other change needed.

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
