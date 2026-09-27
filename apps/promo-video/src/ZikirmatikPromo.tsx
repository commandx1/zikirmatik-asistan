import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { SCENES } from "./constants";
import { IntroScene } from "./scenes/IntroScene";
import { TaglineScene } from "./scenes/TaglineScene";
import { CounterScene } from "./scenes/CounterScene";
import { AiGuideScene } from "./scenes/AiGuideScene";
import { FocusModeScene } from "./scenes/FocusModeScene";
import { StatsScene } from "./scenes/StatsScene";
import { OutroScene } from "./scenes/OutroScene";


export const ZikirmatikPromo: React.FC = () => {
  const frame = useCurrentFrame();

  const isIntro = frame < SCENES.tagline.start;
  const isTagline = frame >= SCENES.tagline.start && frame < SCENES.counter.start;
  const isCounter = frame >= SCENES.counter.start && frame < SCENES.aiGuide.start;
  const isAiGuide = frame >= SCENES.aiGuide.start && frame < SCENES.focusMode.start;
  const isFocusMode = frame >= SCENES.focusMode.start && frame < SCENES.stats.start;
  const isStats = frame >= SCENES.stats.start && frame < SCENES.outro.start;
  const isOutro = frame >= SCENES.outro.start;

  return (
    <AbsoluteFill style={{ background: "#0D1B2A" }}>
      {isIntro && <IntroScene />}
      {isTagline && <TaglineScene />}
      {isCounter && <CounterScene />}
      {isAiGuide && <AiGuideScene />}
      {isFocusMode && <FocusModeScene />}
      {isStats && <StatsScene />}
      {isOutro && <OutroScene />}
    </AbsoluteFill>
  );
};
