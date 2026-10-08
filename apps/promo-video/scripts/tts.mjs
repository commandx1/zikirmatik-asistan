#!/usr/bin/env node
// ElevenLabs TTS for the voice-overs. One call per sentence.
//
//   node scripts/tts.mjs           # video 1 (vo-01) — auto-picks + pins the voice
//   node scripts/tts.mjs 02        # video 2 (vo-02) — reuses vo-01's voice, no re-pick
//   node scripts/tts.mjs 03        # video 3 (vo-03) — same
//   node scripts/tts.mjs 04        # video 4 (vo-04) — same
//
// Reads ELEVENLABS_API_KEY from apps/promo-video/.env (never printed/logged; only
// character counts are logged, per the approved brief).
// video 1: writes public/audio/samples/voice-<name>.mp3 (2 candidates, sentence 1 only),
//          public/audio/vo-01-s<N>.mp3, public/audio/vo-01.json.
// video 2/3/4: writes public/audio/vo-0{2,3,4}-s<N>.mp3 + vo-0{2,3,4}.json, same voice/settings
//          as vo-01 (read from vo-01.json — no new voice pick, no split marker).
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const AUDIO_DIR = path.join(ROOT, "public", "audio");
const SAMPLES_DIR = path.join(AUDIO_DIR, "samples");
mkdirSync(SAMPLES_DIR, { recursive: true });

// --- tiny .env parser (no dotenv dependency) ---
function loadEnv(file) {
  const out = {};
  if (!existsSync(file)) return out;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2];
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}
const env = loadEnv(path.join(ROOT, ".env"));
const API_KEY = env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("ELEVENLABS_API_KEY missing from apps/promo-video/.env");
  process.exit(1);
}

const SENTENCES_BY_ID = {
  "01": [
    "Zikir çekerken sayıyı kaç kere şaşırdın?",
    "Zikrini ister kütüphaneden seç, ister asistana sor; Arapçası, okunuşu ve anlamı aynı ekranda.",
    "Tek dokunuşla say. Hedefe gelince uygulama sana haber verir.",
    "Uygulamayı kapatsan bile kaldığın yerden devam edersin.",
    "Reklamsız ve ücretsiz. Google Play'de Zikirmatik Asistan.",
  ],
  "02": [
    "Sabah zikirlerini unutuyor musun?",
    "Vird programını kur: sabah, akşam ya da namaz sonrası; hazır şablonlardan seç ya da kendin düzenle.",
    "Rehberli seansta sıradaki zikre sen geçersin, sayıyı uygulama tutar.",
    "Hatırlatmalar düzenini korur.",
    "Reklamsız ve ücretsiz başla. Google Play'de Zikirmatik Asistan.",
  ],
  "03": [
    "Ailecek aynı hedefe zikir çekmek ister misin?",
    "Zikir Halkası kur, davet kodunu paylaş; ilk halkan ücretsiz.",
    "Herkesin çektiği tek bir toplamda birleşir; hedefe birlikte ulaşırsınız.",
    "Halkanın ilerlemesini ve üyelerini tek ekranda görürsün.",
    "Reklamsız ve ücretsiz. Google Play'de Zikirmatik Asistan.",
  ],
  "04": [
    "Yarın sınavın var ve içini kaygı mı sardı?",
    "AI Rehber'e niyetini yaz.",
    "Sana bir zikir önerir; faziletini ve kaynağını da gösterir.",
    "Başla'ya dokun, sayıyı uygulama tutsun.",
    "Her gün ücretsiz hakkın var. Google Play'de Zikirmatik Asistan.",
  ],
  "05": [
    "Su yoksa abdest nasıl alınır?",
    "Zikirmatik'te asistana sor.",
    "Asistan güvenilir kaynakları tarar,",
    "cevabı kitabı ve sayfasıyla verir.",
    "Zikirmatik. Reklamsız, her gün ücretsiz AI hakkın var.",
  ],
};

const VIDEO_ID = (process.argv[2] || "01").padStart(2, "0");
const SENTENCES = SENTENCES_BY_ID[VIDEO_ID];
if (!SENTENCES) {
  console.error(`Unknown video id "${VIDEO_ID}" — expected one of ${Object.keys(SENTENCES_BY_ID).join(", ")}`);
  process.exit(1);
}

// Sentence 2 (index 1) splits into two visual sub-beats (2a: library selection, 2b: AI
// Rehber) at this marker's start time, via the with-timestamps endpoint.
const SPLIT_MARKER = "ister asistana";

const MODEL_ID = "eleven_multilingual_v2";
const VOICE_SETTINGS = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.2,
  use_speaker_boost: true,
};

async function api(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: { "xi-api-key": API_KEY, ...(opts.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${opts.method ?? "GET"} ${url} -> ${res.status}: ${body.slice(0, 300)}`);
  }
  return res;
}

async function listVoices() {
  const res = await api("https://api.elevenlabs.io/v1/voices");
  const json = await res.json();
  return json.voices ?? [];
}

async function ttsToFile(voiceId, text, outPath) {
  const res = await api(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, model_id: MODEL_ID, voice_settings: VOICE_SETTINGS }),
    }
  );
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(outPath, buf);
}

// with-timestamps: returns { audio_base64, alignment: { characters, character_start_times_seconds } }.
// Used only for sentence 2, to find where "ister asistana" starts (2a/2b split point).
async function ttsWithTimestamps(voiceId, text, outPath) {
  const res = await api(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, model_id: MODEL_ID, voice_settings: VOICE_SETTINGS }),
    }
  );
  const json = await res.json();
  writeFileSync(outPath, Buffer.from(json.audio_base64, "base64"));
  return json.alignment;
}

function splitTimeFromAlignment(alignment, text, marker) {
  const idx = text.indexOf(marker);
  if (idx === -1 || !alignment?.character_start_times_seconds) return null;
  return alignment.character_start_times_seconds[idx] ?? null;
}

function ffprobeDuration(file) {
  const out = execFileSync("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    file,
  ]).toString().trim();
  return parseFloat(out);
}

function pickCandidates(voices) {
  // Prefer Turkish-capable multilingual voices whose labels read calm/warm/narrative,
  // avoid excited/energetic. ElevenLabs' shared voices don't tag language explicitly on
  // this endpoint, so we rank by label text only.
  const scored = voices.map((v) => {
    const labels = Object.values(v.labels ?? {}).join(" ").toLowerCase();
    const desc = (v.description ?? "").toLowerCase();
    const text = `${labels} ${desc}`;
    let score = 0;
    for (const good of ["calm", "warm", "narration", "narrative", "soft", "soothing", "gentle"]) {
      if (text.includes(good)) score += 2;
    }
    for (const bad of ["excited", "energetic", "shout", "hype", "aggressive"]) {
      if (text.includes(bad)) score -= 3;
    }
    // Mild preference for voices intended for narration/meditation use cases.
    if (text.includes("meditation") || text.includes("narrat")) score += 1;
    return { voice: v, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 2).map((s) => s.voice);
}

// video 2/3: no voice re-pick (brief calls for the SAME voice as vo-01) and no 2a/2b
// split — 5 plain sentences, one TTS call each.
async function runPinnedVoice() {
  const vo01Path = path.join(AUDIO_DIR, "vo-01.json");
  if (!existsSync(vo01Path)) {
    throw new Error(`${vo01Path} not found — run \`node scripts/tts.mjs\` (video 1) first to pin a voice.`);
  }
  const { voice } = JSON.parse(readFileSync(vo01Path, "utf8"));
  console.log(`Reusing vo-01's voice: ${voice.name} (${voice.voiceId})`);

  const manifest = [];
  let totalChars = 0;
  for (let i = 0; i < SENTENCES.length; i++) {
    const text = SENTENCES[i];
    totalChars += text.length;
    const file = `vo-${VIDEO_ID}-s${i + 1}.mp3`;
    const outPath = path.join(AUDIO_DIR, file);
    await ttsToFile(voice.voiceId, text, outPath);
    const durationSec = ffprobeDuration(outPath);
    manifest.push({ index: i + 1, text, file, durationSec });
    console.log(`s${i + 1}: ${durationSec.toFixed(2)}s (${text.length} chars)`);
  }

  writeFileSync(
    path.join(AUDIO_DIR, `vo-${VIDEO_ID}.json`),
    JSON.stringify({ voice, sentences: manifest }, null, 2)
  );
  console.log(`Total characters used: ${totalChars}`);
}

async function main() {
  if (VIDEO_ID !== "01") {
    await runPinnedVoice();
    return;
  }

  const voices = await listVoices();
  if (voices.length < 2) throw new Error(`Expected >=2 voices, got ${voices.length}`);
  const candidates = pickCandidates(voices);
  console.log(
    "Candidates:",
    candidates.map((v) => `${v.name} (${v.voice_id})`).join(", ")
  );

  // Sentence-1 sample from both candidates.
  for (const v of candidates) {
    const outPath = path.join(SAMPLES_DIR, `voice-${v.name.toLowerCase().replace(/\s+/g, "-")}.mp3`);
    await ttsToFile(v.voice_id, SENTENCES[0], outPath);
    console.log(`Sample: ${outPath}`);
  }

  // Chosen voice = top-ranked candidate.
  const chosen = candidates[0];
  console.log(`Chosen voice: ${chosen.name} (${chosen.voice_id})`);

  const manifest = [];
  let totalChars = 0;
  for (let i = 0; i < SENTENCES.length; i++) {
    const text = SENTENCES[i];
    totalChars += text.length;
    const file = `vo-01-s${i + 1}.mp3`;
    const outPath = path.join(AUDIO_DIR, file);
    let splitAtSec = null;
    if (i === 1) {
      // Sentence 2 needs a 2a/2b split point (library selection -> AI Rehber).
      const alignment = await ttsWithTimestamps(chosen.voice_id, text, outPath);
      splitAtSec = splitTimeFromAlignment(alignment, text, SPLIT_MARKER);
    } else {
      await ttsToFile(chosen.voice_id, text, outPath);
    }
    const durationSec = ffprobeDuration(outPath);
    const entry = { index: i + 1, text, file, durationSec };
    if (splitAtSec != null) entry.splitAtSec = splitAtSec;
    manifest.push(entry);
    console.log(`s${i + 1}: ${durationSec.toFixed(2)}s${splitAtSec != null ? ` (split @ ${splitAtSec.toFixed(2)}s)` : ""}`);
  }

  writeFileSync(
    path.join(AUDIO_DIR, "vo-01.json"),
    JSON.stringify({ voice: { name: chosen.name, voiceId: chosen.voice_id }, sentences: manifest }, null, 2)
  );
  console.log(`Total characters used: ${totalChars}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
