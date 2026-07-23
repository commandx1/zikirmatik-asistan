/**
 * Reusable page-tagged recursive splitter for source-passage RAG seeding.
 *
 * Input: array of { page: number, text: string } (raw page text, e.g. from
 * `pdftotext -layout -f N -l N`).
 *
 * Output: array of { chunkIndex, text, pageStart, pageEnd, sectionHeading }.
 *
 * Strategy:
 *  - Normalize whitespace per page (collapse 3+ newlines, strip repeated
 *    spaces, drop lines that are just a page number).
 *  - Split into paragraphs on blank-line boundaries.
 *  - Detect short standalone ALL-CAPS / Title-Case lines as section headings
 *    and carry the most recent one forward.
 *  - Greedily accumulate paragraphs into chunks targeting 800-1000 chars.
 *  - If a single paragraph exceeds the target, fall back to sentence-boundary
 *    splitting so we never cut mid-sentence when avoidable.
 *  - Chunks carry ~150 chars of overlap from the tail of the previous chunk.
 *  - Chunks with <80 chars of real content are dropped (page furniture).
 */

const TARGET_MIN = 800;
const TARGET_MAX = 1000;
const OVERLAP_SIZE = 150;
const MIN_CHUNK_LENGTH = 80;

const TURKISH_UPPER = 'A-ZÇĞİÖŞÜ';
const TURKISH_LOWER = 'a-zçğıöşü';

const CONNECTOR_WORDS = new Set([
  've',
  'ile',
  'de',
  'da',
  'bir',
  'ki',
  'ya',
  'mı',
  'mi',
  'mu',
  'mü',
  'ile',
  'için',
  'gibi',
]);

/** Collapse repeated whitespace and drop bare page-number lines from a page's raw text. */
function normalizePageText(rawText) {
  const text = String(rawText ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const lines = text.split('\n').map((line) => {
    // Collapse repeated spaces/tabs within a line.
    return line.replace(/[ \t]+/g, ' ').replace(/[ \t]+$/g, '').trimEnd();
  });

  const filtered = lines.filter((line) => {
    const trimmed = line.trim();
    // Drop lines that are just a page number (e.g. "12", "- 12 -", "12.").
    if (/^[-–—\s]*\d{1,4}[-–—\s.]*$/.test(trimmed) && trimmed.length > 0) {
      return false;
    }
    return true;
  });

  let joined = filtered.join('\n');
  // Collapse 3+ consecutive newlines into a paragraph break.
  joined = joined.replace(/\n{3,}/g, '\n\n');
  return joined.trim();
}

/** Split normalized page text into paragraph blocks (blank-line separated). */
function splitParagraphs(normalizedText) {
  if (!normalizedText) {
    return [];
  }
  return normalizedText
    .split(/\n{2,}/)
    .map((block) => block.replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').trim())
    .filter((block) => block.length > 0);
}

function isTitleCaseWord(word) {
  const re = new RegExp(`^[${TURKISH_UPPER}0-9]`);
  return re.test(word);
}

/** Heuristic: short, standalone, no trailing sentence punctuation, ALL-CAPS or Title Case. */
function isHeadingCandidate(paragraph) {
  if (!paragraph || paragraph.length >= 60) {
    return false;
  }
  if (/[.,;:]$/.test(paragraph)) {
    return false;
  }
  const hasLetters = new RegExp(`[${TURKISH_UPPER}${TURKISH_LOWER}]`).test(paragraph);
  if (!hasLetters) {
    return false;
  }

  const upperRe = new RegExp(`^[^${TURKISH_LOWER}]*$`);
  if (upperRe.test(paragraph)) {
    return true;
  }

  const words = paragraph.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return false;
  }
  const isTitleCase = words.every((word) => {
    const lower = word.toLowerCase();
    if (CONNECTOR_WORDS.has(lower)) {
      return true;
    }
    return isTitleCaseWord(word);
  });
  return isTitleCase;
}

/**
 * Split a long block of text into sentences, keeping delimiters attached.
 * PDF extraction (esp. Turkish -layout output) frequently drops the space
 * after a sentence-ending punctuation mark (e.g. "hamdolsun.Rasûllerin"), so
 * we also split when an uppercase letter immediately follows the punctuation.
 */
function splitSentences(text) {
  const parts = text.split(
    /(?<=[.!?])\s+(?=[^\s])|(?<=[.!?])(?=[A-ZÇĞİÖŞÜ])/,
  );
  return parts.map((part) => part.trim()).filter(Boolean);
}

/**
 * Build the flat list of processing units across all pages: paragraphs
 * (tagged as heading or content) each associated with the page they came from.
 */
function buildUnits(pages) {
  const units = [];
  for (const { page, text } of pages) {
    const normalized = normalizePageText(text);
    const paragraphs = splitParagraphs(normalized);
    for (const paragraph of paragraphs) {
      const heading = isHeadingCandidate(paragraph);
      units.push({ page, text: paragraph, isHeading: heading });
    }
  }
  return units;
}

/** Find a sentence-aligned tail of `text` of roughly `size` characters, for overlap. */
function tailOverlap(text, size) {
  if (text.length <= size) {
    return text;
  }
  const window = text.slice(-Math.min(text.length, size + 200));
  const sentences = splitSentences(window);
  if (sentences.length <= 1) {
    return text.slice(-size);
  }

  let acc = '';
  for (let i = sentences.length - 1; i >= 0; i -= 1) {
    const candidate = sentences[i] + (acc ? ' ' + acc : '');
    if (candidate.length > size + 200) {
      break;
    }
    acc = candidate;
    if (acc.length >= size) {
      break;
    }
  }
  return acc || text.slice(-size);
}

/**
 * Chunk an array of { page, text } page records into passage chunks.
 * @param {{page:number, text:string}[]} pages
 * @returns {{chunkIndex:number, text:string, pageStart:number, pageEnd:number, sectionHeading:string|null}[]}
 */
export function chunkPages(pages) {
  const units = buildUnits(pages);

  const chunks = [];
  let bufferParts = []; // array of { text, joiner: '\n\n' | ' ' }
  let bufferLen = 0;
  let bufferPageStart = null;
  let bufferPageEnd = null;
  let currentHeading = null;
  let chunkHeadingAtStart = null;

  const bufferText = () =>
    bufferParts.reduce((acc, part, idx) => (idx === 0 ? part.text : acc + part.joiner + part.text), '');

  function resetBuffer() {
    bufferParts = [];
    bufferLen = 0;
    bufferPageStart = null;
    bufferPageEnd = null;
  }

  function finalizeChunk() {
    const text = bufferText().trim();
    let overlapSeed = null;

    if (text.length >= MIN_CHUNK_LENGTH) {
      chunks.push({
        chunkIndex: chunks.length,
        text,
        pageStart: bufferPageStart,
        pageEnd: bufferPageEnd,
        sectionHeading: chunkHeadingAtStart,
      });
      overlapSeed = tailOverlap(text, OVERLAP_SIZE);
    }

    const carryPage = bufferPageEnd;
    resetBuffer();
    chunkHeadingAtStart = currentHeading;

    if (overlapSeed) {
      bufferParts.push({ text: overlapSeed, joiner: '\n\n' });
      bufferLen = overlapSeed.length;
      bufferPageStart = carryPage;
      bufferPageEnd = carryPage;
    }
  }

  function addSegment(segmentText, page, joiner) {
    if (!segmentText) {
      return;
    }
    if (bufferPageStart === null) {
      bufferPageStart = page;
    }
    bufferPageEnd = page;
    bufferParts.push({ text: segmentText, joiner });
    bufferLen += segmentText.length + (bufferParts.length > 1 ? joiner.length : 0);
  }

  function addParagraph(paragraph, page) {
    if (bufferLen > 0 && bufferLen + paragraph.length + 2 > TARGET_MAX && bufferLen >= TARGET_MIN) {
      finalizeChunk();
    }

    if (paragraph.length <= TARGET_MAX) {
      // If still too big even after a fresh finalize (rare), fall through to sentence split.
      if (bufferLen === 0 || bufferLen + paragraph.length + 2 <= TARGET_MAX + 200) {
        addSegment(paragraph, page, '\n\n');
        if (bufferLen >= TARGET_MAX) {
          finalizeChunk();
        }
        return;
      }
    }

    // Paragraph is too long (or buffer can't absorb it cleanly) - split into sentences.
    const sentences = splitSentences(paragraph);
    for (const sentence of sentences) {
      if (bufferLen > 0 && bufferLen + sentence.length + 1 > TARGET_MAX && bufferLen >= TARGET_MIN) {
        finalizeChunk();
      }
      addSegment(sentence, page, bufferParts.length > 0 ? ' ' : '\n\n');
      if (bufferLen >= TARGET_MAX) {
        finalizeChunk();
      }
    }
  }

  for (const unit of units) {
    if (unit.isHeading) {
      // Meaningful accumulated content: close out the current section before
      // moving the heading pointer, so the new heading applies only forward.
      if (bufferLen >= 200) {
        finalizeChunk();
      }
      currentHeading = unit.text;
      continue;
    }
    addParagraph(unit.text, unit.page);
  }

  if (bufferLen > 0) {
    finalizeChunk();
  }

  return chunks;
}

export const __internals = {
  normalizePageText,
  splitParagraphs,
  isHeadingCandidate,
  splitSentences,
  tailOverlap,
};
