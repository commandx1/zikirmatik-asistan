import { beforeEach, describe, expect, it, vi } from "vitest";
import type { playClickSound as PlayClickSoundFn } from "./click-sound";

type MockPlayer = {
  play: ReturnType<typeof vi.fn>;
  seekTo: ReturnType<typeof vi.fn>;
};

let createdPlayers: MockPlayer[] = [];

const createAudioPlayerMock = vi.fn(() => {
  const player: MockPlayer = {
    play: vi.fn(),
    seekTo: vi.fn().mockResolvedValue(undefined)
  };
  createdPlayers.push(player);
  return player;
});

const setAudioModeAsyncMock = vi.fn().mockResolvedValue(undefined);

vi.mock("expo-audio", () => ({
  createAudioPlayer: createAudioPlayerMock,
  setAudioModeAsync: setAudioModeAsyncMock
}));

// click-sound.ts bu iki asset'i import eder; gerçek .wav ikilisini
// yüklemeye/parse etmeye çalışmak yerine Metro'nun gerçek davranışına
// (sayısal bir asset id) eşdeğer sahte değerlerle değiştiriyoruz.
vi.mock("../../assets/sounds/tik.wav", () => ({ default: 1 }));
vi.mock("../../assets/sounds/ahsap.wav", () => ({ default: 2 }));

// click-sound.ts modül seviyesinde kalıcı durum tutar (havuzlar +
// "audio mode configured" bayrağı). Her test'in temiz bir havuzla
// başlayabilmesi için modül kaydı sıfırlanıp yeniden import edilir.
async function loadPlayClickSound(): Promise<typeof PlayClickSoundFn> {
  vi.resetModules();
  createdPlayers = [];
  createAudioPlayerMock.mockClear();
  setAudioModeAsyncMock.mockClear();
  const mod = await import("./click-sound");
  return mod.playClickSound;
}

describe("playClickSound", () => {
  let playClickSound: typeof PlayClickSoundFn;

  beforeEach(async () => {
    playClickSound = await loadPlayClickSound();
  });

  it("is a no-op when the pack is 'off'", () => {
    playClickSound("off");

    expect(createAudioPlayerMock).not.toHaveBeenCalled();
    expect(setAudioModeAsyncMock).not.toHaveBeenCalled();
  });

  it("lazily creates a 3-player pool on first use of a pack", () => {
    expect(createAudioPlayerMock).not.toHaveBeenCalled();

    playClickSound("tik");

    expect(createAudioPlayerMock).toHaveBeenCalledTimes(3);
  });

  it("does not create the 'ahsap' pool while only 'tik' has played", () => {
    playClickSound("tik");
    playClickSound("tik");

    expect(createAudioPlayerMock).toHaveBeenCalledTimes(3);
  });

  it("keeps separate 3-player pools per sound pack", () => {
    playClickSound("tik");
    playClickSound("ahsap");

    expect(createAudioPlayerMock).toHaveBeenCalledTimes(6);
    expect(createAudioPlayerMock).toHaveBeenNthCalledWith(1, 1);
    expect(createAudioPlayerMock).toHaveBeenNthCalledWith(4, 2);
  });

  it("seeks to 0 before playing, so a restarted click plays from the start", () => {
    playClickSound("tik");

    expect(createdPlayers[0]!.seekTo).toHaveBeenCalledWith(0);
    expect(createdPlayers[0]!.play).toHaveBeenCalledTimes(1);
  });

  it("rotates round-robin across the pool on rapid repeated taps", () => {
    playClickSound("tik");
    playClickSound("tik");
    playClickSound("tik");
    playClickSound("tik"); // 4th tap wraps back to the first player

    expect(createdPlayers).toHaveLength(3);
    expect(createdPlayers[0]!.play).toHaveBeenCalledTimes(2);
    expect(createdPlayers[1]!.play).toHaveBeenCalledTimes(1);
    expect(createdPlayers[2]!.play).toHaveBeenCalledTimes(1);
  });

  it("configures the audio mode exactly once, regardless of how many taps follow", () => {
    playClickSound("tik");
    playClickSound("tik");
    playClickSound("ahsap");

    expect(setAudioModeAsyncMock).toHaveBeenCalledTimes(1);
    expect(setAudioModeAsyncMock).toHaveBeenCalledWith({
      playsInSilentMode: false,
      shouldPlayInBackground: false,
      interruptionMode: "mixWithOthers"
    });
  });

  it("never throws when createAudioPlayer throws", () => {
    createAudioPlayerMock.mockImplementationOnce(() => {
      throw new Error("native module missing");
    });

    expect(() => playClickSound("tik")).not.toThrow();
  });

  it("never throws when seekTo rejects", async () => {
    playClickSound("tik");
    createdPlayers[0]!.seekTo.mockRejectedValueOnce(new Error("player not loaded"));

    expect(() => playClickSound("tik")).not.toThrow();
    // Let the rejected seekTo promise settle so it doesn't surface as an
    // unhandled rejection in a later test.
    await Promise.resolve();
  });

  it("never throws when play throws synchronously", () => {
    playClickSound("tik");
    createdPlayers[0]!.play.mockImplementationOnce(() => {
      throw new Error("player was removed");
    });

    expect(() => playClickSound("tik")).not.toThrow();
  });
});
