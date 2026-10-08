import React from "react";
import { Composition, Still, staticFile } from "remotion";
import { ZikirmatikPromo } from "./ZikirmatikPromo";
import { ShortVideo, SHORT_VIDEO_TOTAL_FRAMES, shortVideoDurationInFrames } from "./ShortVideo";
import { FPS, TOTAL_FRAMES, WIDTH, HEIGHT } from "./constants";
import pilot04Props from "../pilots/pilot-04-kutuphane.json";
import pilot05Props from "../pilots/pilot-05-temalar.json";
import storyCounterProps from "../pilots/story-counter.json";
import { RichVideo01, richVideoDurationInFrames } from "./RichVideo";
import { createRichVideo, richVideoGenericDurationInFrames, type RichVideoManifest } from "./RichVideoGeneric";
import rich02Config from "../pilots/rich-02.json";
import rich03Config from "../pilots/rich-03.json";
import rich04Config from "../pilots/rich-04.json";
import rich05Config from "../pilots/rich-05.json";
import { RichVideoCover05 } from "./RichVideoCover05";
import { RichVideoCover04 } from "./RichVideoCover04";
import vo02 from "../public/audio/vo-02.json";
import vo03 from "../public/audio/vo-03.json";
import vo04 from "../public/audio/vo-04.json";
import vo05 from "../public/audio/vo-05.json";

const richVideo02Manifest = { ...rich02Config, voManifest: vo02 } as unknown as RichVideoManifest;
const richVideo03Manifest = { ...rich03Config, voManifest: vo03 } as unknown as RichVideoManifest;
const richVideo04Manifest = { ...rich04Config, voManifest: vo04 } as unknown as RichVideoManifest;
const RichVideo02 = createRichVideo(richVideo02Manifest);
const RichVideo03 = createRichVideo(richVideo03Manifest);
const RichVideo04 = createRichVideo(richVideo04Manifest);
const richVideo05Manifest = { ...rich05Config, voManifest: vo05 } as unknown as RichVideoManifest;
const RichVideo05 = createRichVideo(richVideo05Manifest);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ZikirmatikPromo"
        component={ZikirmatikPromo}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="ShortVideo"
        component={ShortVideo}
        durationInFrames={SHORT_VIDEO_TOTAL_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{
          hookText: "Örnek kanca metni",
          captions: [
            { text: "Tek dokunuşla say", startSec: 1, durationSec: 4 },
            { text: "Kaldığın yerden devam et", startSec: 14, durationSec: 4 },
          ],
          recordingSrc: staticFile("recordings/counter-pilot.mp4"),
          sourceLine: "Kaynak: —",
          ctaText: "Google Play'de ücretsiz",
          loop: true,
        }}
      />
      {/*
        Scripted counter clip (apps/promo-video/scripts/record.mjs counter) writes to
        recordings/counter.mp4, distinct from the manual pilot-03 clip baked into the
        "ShortVideo" default above (recordings/counter-pilot.mp4) — kept separate so the
        two are directly comparable; render with
        `npx remotion render ShortVideo-counter-scripted out/short-pilot-03-scripted.mp4 --codec=h264`.
      */}
      <Composition
        id="ShortVideo-counter-scripted"
        component={ShortVideo}
        durationInFrames={SHORT_VIDEO_TOTAL_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{
          hookText: "Örnek kanca metni",
          captions: [
            { text: "Tek dokunuşla say", startSec: 1, durationSec: 4 },
            { text: "Kaldığın yerden devam et", startSec: 14, durationSec: 4 },
          ],
          recordingSrc: staticFile("recordings/counter.mp4"),
          sourceLine: "Kaynak: —",
          ctaText: "Google Play'de ücretsiz",
          loop: true,
        }}
      />
      {/*
        Pilots 04/05: `remotion render ShortVideo out.mp4 --props=pilots/x.json` 404s on the
        recording (see README-short.md "Scripted recording pipeline" — a reproducible
        @remotion/bundler bug in this project where any `--props` override, file or inline,
        breaks the bundle's /public static route, independent of which asset is referenced).
        Baking the same pilots/*.json as defaultProps on their own composition id is the
        verified-working substitute; render with
        `npx remotion render ShortVideo-pilot-04 out/short-pilot-04.mp4 --codec=h264`.
      */}
      <Composition
        id="ShortVideo-pilot-04"
        component={ShortVideo}
        durationInFrames={SHORT_VIDEO_TOTAL_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{
          ...pilot04Props,
          // staticFile() (not a plain "/recordings/..." string, even though it resolves to
          // the same value) is what registers the asset with the bundler's public-file
          // server — see the comment above.
          recordingSrc: staticFile("recordings/library.mp4"),
        }}
      />
      <Composition
        id="ShortVideo-pilot-05"
        component={ShortVideo}
        durationInFrames={SHORT_VIDEO_TOTAL_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{
          ...pilot05Props,
          recordingSrc: staticFile("recordings/themes.mp4"),
        }}
      />
      {/*
        Video 1 ("Sayarken şaşırma"): ONE continuous recording (loop: false), played once at
        its real length. apps/promo-video/scripts/record.mjs story-counter writes both
        public/recordings/story-counter.mp4 and pilots/story-counter.json (recordingDurationSec
        + caption from/to windows, derived from the spec's wall-clock beat markers) — re-run
        that script to refresh both, then re-render this composition; render with
        `npx remotion render ShortVideo-story-counter out/video-01-sayarken-sasirma.mp4 --codec=h264`.
      */}
      <Composition
        id="ShortVideo-story-counter"
        component={ShortVideo}
        durationInFrames={shortVideoDurationInFrames(storyCounterProps, FPS)}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{
          ...storyCounterProps,
          recordingSrc: staticFile("recordings/story-counter.mp4"),
        }}
      />
      {/*
        Video 1, voiced version: the 5 VO sentences (public/audio/vo-01.json) drive the
        timeline instead of caption-driven beat markers — see src/RichVideo.tsx. Render with
        `npx remotion render RichVideo-01 out/video-01-sesli.mp4 --codec=h264`.
      */}
      <Composition
        id="RichVideo-01"
        component={RichVideo01}
        durationInFrames={richVideoDurationInFrames(FPS)}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      {/*
        Video 2 ("Vird") / Video 3 ("Halka"), voiced: JSON-driven via src/RichVideoGeneric.tsx
        (pilots/rich-02.json / rich-03.json — per-scene source ranges + speed ramps, public/
        audio/vo-02.json / vo-03.json for the timeline). Render with
        `npx remotion render RichVideo-02 out/video-02-vird-sesli.mp4 --codec=h264` /
        `npx remotion render RichVideo-03 out/video-03-halka-sesli.mp4 --codec=h264`.
      */}
      <Composition
        id="RichVideo-02"
        component={RichVideo02}
        durationInFrames={richVideoGenericDurationInFrames(richVideo02Manifest, FPS)}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="RichVideo-03"
        component={RichVideo03}
        durationInFrames={richVideoGenericDurationInFrames(richVideo03Manifest, FPS)}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      {/*
        Video 4 ("AI Rehber", Instagram Reels): same generic pipeline, CFR-normalized Samsung
        recordings (public/recordings/ai-rehber-04-*-cfr.mp4), status/nav bar masks and IG
        safe-zone caption (pilots/rich-04.json). Render with
        `npx remotion render RichVideo-04 out/video-04-ai-rehber.mp4 --codec=h264`; cover with
        `npx remotion still RichVideo-04-cover out/video-04-kapak.png`.
      */}
      <Composition
        id="RichVideo-04"
        component={RichVideo04}
        durationInFrames={richVideoGenericDurationInFrames(richVideo04Manifest, FPS)}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Still id="RichVideo-04-cover" component={RichVideoCover04} width={WIDTH} height={HEIGHT} />
      {/* Video 5 ("AI Sohbet"): `npx remotion render RichVideo-05 out/video-05-ai-sohbet-sesli.mp4 --codec=h264` */}
      <Composition
        id="RichVideo-05"
        component={RichVideo05}
        durationInFrames={richVideoGenericDurationInFrames(richVideo05Manifest, FPS)}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Still id="RichVideo-05-cover" component={RichVideoCover05} width={WIDTH} height={HEIGHT} />
    </>
  );
};
