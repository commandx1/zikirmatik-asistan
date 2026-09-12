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
 *    and carry the most recent one forward. Opt-in `headingColon` option also
 *    recognizes such lines when they end with a single trailing colon (colon
 *    stripped from the stored heading); default off, byte-identical output.
 *    When `headingColon` is on, this also catches such heading lines when
 *    they sit embedded inside a paragraph (no blank line before/after,
 *    e.g. a PDF layout that runs a section title directly into the next
 *    line) by scanning physical lines before they are joined, splitting the
 *    paragraph at that line. Under `headingColon`, the Title-Case allowance
 *    is replaced by a stricter (mostly) ALL-CAPS check, source/hadith
 *    reference lines ("Bakara Sûresi: 255", "Buhâri, (7/99)") and narration
 *    lead-ins ("Buyurdu ki:") are excluded outright, and a heading PDF layout
 *    wrapped across two or three physical lines is spliced back into one.
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

// Arabic-script code points (main block, supplement, extended-A, presentation
// forms A/B) plus bidi/format control characters that `pdftotext` sometimes
// emits around reversed/garbled Arabic glyph runs (zero-width joiners, LRM/RLM,
// embedding/override/isolate controls, BOM).
const ARABIC_SCRIPT_RE =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;

const LETTER_RE = new RegExp(`[${TURKISH_UPPER}${TURKISH_LOWER}]`);
const LETTER_RE_GLOBAL = new RegExp(`[${TURKISH_UPPER}${TURKISH_LOWER}]`, 'g');

// --- `headingColon`-only heading restrictions -------------------------------
// Everything below this point is used exclusively by the `headingColon` path
// (via `classifyHeading`'s headingColon branch and the multi-line heading
// merge scan). None of it is reachable from the default (flag-off) path, so
// default output stays byte-identical.

// A verse/hadith source-reference line is never a section heading under
// `headingColon`, even when it happens to be short and Title-Case/ALL-CAPS
// (e.g. "Bakara Sûresi: 255", "Nas Sûresi", "Buhâri, (7/99)"):
//  - any "<İsim> Sûresi" or "<İsim> Sûresi: N(-N)" reference,
//  - a line starting with a hadith-collection name / "Bkz." source pointer,
//  - a line containing a "(volume/page)" reference like "(4/103)".
const SURESI_REF_RE = /Sûresi\s*:?\s*\d*/i;
const HADITH_SOURCE_PREFIX_RE =
  /^(Bkz\.|Buhâri|Müslim|Tirmizi|Ebu Dâvud|Nesâi|İbn-i|Ahmed|Hâkim|Elbâni)/;
const PAGE_RATIO_REF_RE = /\(\d+\/\d+\)/;

function isHeadingRefExclusion(text) {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) {
    return false;
  }
  return (
    SURESI_REF_RE.test(trimmed) ||
    HADITH_SOURCE_PREFIX_RE.test(trimmed) ||
    PAGE_RATIO_REF_RE.test(trimmed)
  );
}

// A candidate ending in "ki"/"dedi"/"der"/"buyurdu" (once any trailing colon
// is stripped) is narration lead-in text ("... buyurdu ki:", "... der:"), not
// a section title, no matter how it capitalizes.
const HEADING_VERB_ENDING_RE = /(?:^|\s)(ki|dedi|der|buyurdu)$/;

function endsWithHeadingExcludedVerb(text) {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) {
    return false;
  }
  return HEADING_VERB_ENDING_RE.test(trimmed.toLocaleLowerCase('tr'));
}

// Fixed Islamic-honorific insertions ("-sallallahu aleyhi ve sellem-",
// "-radıyallahu anhâ-", ...) are a recurring convention in this text and show
// up embedded inside otherwise ALL-CAPS section titles/questions. They are
// ignored when judging how "shouty" a line is, so a heading like
// "NEBİ -sallallahu aleyhi ve sellem- NASIL TESBİH ÇEKERDİ?" still counts as
// ALL-CAPS.
const HONORIFIC_HYPHEN_PHRASE_RE = new RegExp(
  `-[${TURKISH_LOWER}]+(?:\\s+[${TURKISH_LOWER}]+)*-`,
  'g',
);

/** Uppercase-letter ratio (Turkish-aware, honorific insertions ignored), or `null` when there are fewer than 2 letters. */
function upperCaseLetterRatio(text) {
  const withoutHonorifics = String(text ?? '').replace(HONORIFIC_HYPHEN_PHRASE_RE, ' ');
  const letters = withoutHonorifics.match(LETTER_RE_GLOBAL);
  if (!letters || letters.length < 2) {
    return null;
  }
  const upperCount = letters.filter((ch) => ch === ch.toLocaleUpperCase('tr')).length;
  return upperCount / letters.length;
}

/** True when ≥80% of `text`'s letters (Turkish-aware, honorific insertions ignored) are uppercase, and it has ≥2 letters. */
function isMostlyUpperCase(text) {
  const ratio = upperCaseLetterRatio(text);
  return ratio !== null && ratio >= 0.8;
}

/**
 * Additional `headingColon`-only acceptance check layered on top of
 * `isHeadingCandidate`: never a source/hadith reference, never narration
 * lead-in text, and - replacing the default path's Title-Case allowance,
 * which is too noisy for this book - must be (mostly) ALL-CAPS.
 */
function isHeadingColonCandidate(text) {
  if (isHeadingRefExclusion(text) || endsWithHeadingExcludedVerb(text)) {
    return false;
  }
  return isMostlyUpperCase(text);
}

/** Count Arabic-script/control characters (matching stripArabicScript's own removal set) in `text`, for reporting. */
export function countArabicScriptChars(text) {
  const matches = String(text ?? '').match(ARABIC_SCRIPT_RE);
  return matches ? matches.length : 0;
}

/**
 * Remove garbled Arabic-script glyph runs and bidi/format control characters
 * from raw page text, line by line, BEFORE chunking — so chunk boundaries and
 * `chunkIndex` are computed on the cleaned text. Opt-in only: sources whose
 * `pdftotext -layout` output mixes reversed Arabic glyphs into otherwise-clean
 * Turkish text (e.g. Hısnu'l-Muslim) should pass their page text through this
 * first. The Turkish meal/content on the same line is preserved verbatim.
 *
 * Per line:
 *  - Strip every character in the Arabic-script/control ranges above.
 *  - Collapse runs of spaces/tabs to a single space; trim the line end.
 *  - If the line HAD real content but is now empty, drop it entirely (it was
 *    pure Arabic glyphs/controls).
 *  - If the line HAD real content but what remains has no Latin/Turkish
 *    letter (only digits/punctuation/whitespace — e.g. a leftover standalone
 *    footnote number like "2", or leftover diacritic residue), drop it too.
 *  - Lines that were already blank are left as blank (paragraph separators
 *    are not touched).
 *
 * @param {string} text
 * @returns {string}
 */
export function stripArabicScript(text) {
  const input = String(text ?? '');

  const lines = input.split(/\r\n|\r|\n/).map((rawLine) => {
    const hadContent = rawLine.trim().length > 0;

    const withoutArabic = rawLine.replace(ARABIC_SCRIPT_RE, '');
    const collapsed = withoutArabic.replace(/[ \t]+/g, ' ').replace(/[ \t]+$/g, '');
    const trimmedNow = collapsed.trim();

    if (hadContent && trimmedNow.length === 0) {
      // Whole line was Arabic glyphs / bidi controls.
      return null;
    }
    if (hadContent && !LETTER_RE.test(trimmedNow)) {
      // Leftover residue with no Turkish/Latin letter left (standalone
      // footnote/number token, stray punctuation/diacritic marks, ...).
      return null;
    }
    return collapsed;
  });

  return lines.filter((line) => line !== null).join('\n');
}

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

/**
 * Split normalized page text into raw paragraph blocks (blank-line
 * separated), keeping each block's internal newlines intact so callers can
 * inspect individual physical lines before joining them. Used only by the
 * `headingColon` embedded-heading scan; `splitParagraphs` above (byte-for-byte
 * unchanged) remains the default-path block splitter.
 */
function splitParagraphBlocksRaw(normalizedText) {
  if (!normalizedText) {
    return [];
  }
  return normalizedText.split(/\n{2,}/).filter((block) => block.trim().length > 0);
}

function isTitleCaseWord(word) {
  const re = new RegExp(`^[${TURKISH_UPPER}0-9]`);
  return re.test(word);
}

/**
 * Shape gate shared by `isHeadingCandidate` (default path: ALL-CAPS or
 * Title-Case) and, under `headingColon`, `isHeadingColonCandidate` (which
 * substitutes its own honorific-aware ALL-CAPS ratio check instead): short,
 * standalone, no trailing sentence punctuation, has at least one letter.
 */
function hasHeadingShape(paragraph) {
  if (!paragraph || paragraph.length >= 60) {
    return false;
  }
  if (/[.,;:]$/.test(paragraph)) {
    return false;
  }
  return new RegExp(`[${TURKISH_UPPER}${TURKISH_LOWER}]`).test(paragraph);
}

/** Heuristic: short, standalone, no trailing sentence punctuation, ALL-CAPS or Title Case. */
function isHeadingCandidate(paragraph) {
  if (!hasHeadingShape(paragraph)) {
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
 * If `paragraph` ends with exactly one trailing colon (optionally followed by
 * whitespace, already trimmed away by `splitParagraphs`), return the text
 * with that colon removed and re-trimmed. Returns `null` for anything else,
 * including a run of two or more trailing colons ("::"), which is not a
 * "single trailing colon" and is left alone.
 */
function stripSingleTrailingColon(paragraph) {
  if (!paragraph || !paragraph.endsWith(':')) {
    return null;
  }
  const withoutColon = paragraph.slice(0, -1);
  if (withoutColon.endsWith(':')) {
    return null;
  }
  const trimmed = withoutColon.trimEnd();
  return trimmed.length > 0 ? trimmed : null;
}

// A line that looks like a table-of-contents entry: a dot leader ("......")
// of 3+ dots anywhere on the line, or a shorter run of 2+ dots immediately
// followed (at the end of the line) by a page number. Used only by the
// embedded-heading scan (`headingColon`) to avoid mistaking TOC rows for
// section headings when they show up as a standalone physical line inside
// a paragraph block.
const TOC_DOTTED_LINE_RE = /\.{3,}|\.{2,}\s*\d{1,4}\s*$/;

function isTocLikeLine(line) {
  return TOC_DOTTED_LINE_RE.test(line);
}

/** True when `line` has no Turkish/Latin letter at all (only digits/punctuation/whitespace). */
function isLetterlessLine(line) {
  return !LETTER_RE.test(line);
}

/**
 * Split a raw (pre-join) paragraph block into an ordered list of
 * `{ isHeading, text }` segments, detecting heading lines embedded inside
 * the block (no blank line separating them from surrounding text) rather
 * than only at whole-paragraph boundaries.
 *
 * `rawBlock` still has its internal newlines (one raw physical line per
 * `\n`); each physical line is trimmed and tested on its own against
 * `classifyHeading`. TOC-like lines (dot leaders / trailing page numbers)
 * and letterless lines (bare digits/punctuation) are never treated as
 * headings here, even if they would otherwise pass the heading heuristic.
 * Content lines are accumulated and flushed (join + collapse whitespace,
 * matching `splitParagraphs`) whenever a heading line is found or the block
 * ends.
 *
 * A block that contains ANY table-of-contents-dotted line is never split:
 * multi-line TOC entries wrap a heading's own title across two physical
 * lines (the first line plain, the second carrying the dot leader + page
 * number), and testing each line independently would otherwise misdetect
 * that first, dot-less wrapped line as a standalone embedded heading. Such
 * a block is returned unsplit, as a single non-heading segment - matching
 * how it was handled before this change (whole-block classification, run
 * by the caller).
 */
function splitEmbeddedHeadings(rawBlock, { headingColon }) {
  const lines = rawBlock.split('\n');

  if (lines.some((line) => isTocLikeLine(line.trim()))) {
    const text = rawBlock.replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').trim();
    return text.length > 0 ? [{ isHeading: false, text }] : [];
  }

  const segments = [];
  let bufferLines = [];

  function flushBuffer() {
    if (bufferLines.length === 0) {
      return;
    }
    const text = bufferLines.join('\n').replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').trim();
    bufferLines = [];
    if (text.length > 0) {
      segments.push({ isHeading: false, text });
    }
  }

  for (const rawLine of lines) {
    const trimmedLine = rawLine.trim();

    // Already assembled by `mergeWrappedHeadingLines` (a heading PDF layout
    // wrapped across physical lines): take it directly, bypassing
    // `classifyHeading`'s length cap, which a merged title routinely exceeds.
    if (trimmedLine.startsWith(MERGED_HEADING_MARKER)) {
      flushBuffer();
      segments.push({ isHeading: true, text: trimmedLine.slice(MERGED_HEADING_MARKER.length) });
      continue;
    }

    if (trimmedLine.length === 0 || isLetterlessLine(trimmedLine)) {
      bufferLines.push(rawLine);
      continue;
    }

    const heading = classifyHeading(trimmedLine, { headingColon });
    if (heading !== null) {
      flushBuffer();
      segments.push({ isHeading: true, text: heading });
      continue;
    }

    bufferLines.push(rawLine);
  }
  flushBuffer();

  return segments;
}

/**
 * Classify a paragraph as a section heading, returning the heading text to
 * store (colon-stripped when applicable) or `null` when it is not a heading.
 *
 * Opt-in `headingColon`: ALL-CAPS section titles in some sources (e.g.
 * Hısnu'l-Muslim) are typeset with a trailing colon
 * ("EVDEN ÇIKARKEN YAPILAN DUÂ:"), which `isHeadingCandidate` otherwise
 * rejects (it excludes lines ending in `. , ; :`). When `headingColon` is
 * true, a line that qualifies as a heading candidate once a single trailing
 * colon is stripped is treated as a heading (colon removed from the stored
 * text) - but ONLY once it also clears `isHeadingColonCandidate`: source/
 * hadith reference lines ("Bakara Sûresi: 255", "Buhâri, (7/99)") and
 * narration lead-ins ("Buyurdu ki:") are excluded, and (replacing the default
 * path's Title-Case allowance, too noisy for this book) the line must be
 * (mostly) ALL-CAPS. This restriction applies to both the plain-paragraph
 * check and the colon-stripped check below - never to the default (flag-off)
 * path, which is untouched and stays byte-identical.
 */
function classifyHeading(paragraph, { headingColon = false } = {}) {
  if (!headingColon) {
    return isHeadingCandidate(paragraph) ? paragraph : null;
  }

  // headingColon: same shape gate (`hasHeadingShape`) as the default path,
  // but with `isHeadingColonCandidate`'s honorific-aware ALL-CAPS ratio (plus
  // reference/narration exclusions) standing in for the default's ALL-CAPS-
  // or-Title-Case test - `isHeadingCandidate` itself is intentionally NOT
  // called here, since its Title-Case branch would reject a line like
  // "NEBİ -sallallahu aleyhi ve sellem- NASIL TESBİH ÇEKERDİ?" over the
  // lowercase honorific alone.
  if (hasHeadingShape(paragraph) && isHeadingColonCandidate(paragraph)) {
    return paragraph;
  }
  const stripped = stripSingleTrailingColon(paragraph);
  if (stripped !== null && hasHeadingShape(stripped) && isHeadingColonCandidate(stripped)) {
    return stripped;
  }
  return null;
}

// Sentinel prefix used internally by `mergeWrappedHeadingLines` to mark an
// already-assembled multi-line heading so `splitEmbeddedHeadings` treats it
// as a heading directly, bypassing `isHeadingCandidate`'s ~60-char length cap
// (a merged two/three-line title routinely runs longer than that). Uses a
// NUL byte, which never appears in extracted PDF text, so it can't collide
// with real content.
const MERGED_HEADING_MARKER = ' HEADING ';

/**
 * `headingColon`-only: is `trimmedLine` the FIRST physical line of a section
 * heading that PDF layout wrapped onto a following line - ALL-CAPS (per
 * `isHeadingColonCandidate`'s ratio, honorifics aside), not itself a
 * complete heading (no trailing `:`/`?`), not a TOC dot-leader row, and short
 * enough to plausibly be a wrapped title (allow up to ~90 chars, longer than
 * a normal single-line heading)?
 */
function isHeadingMergeLead(trimmedLine) {
  if (!trimmedLine || trimmedLine.length > 90) {
    return false;
  }
  if (isLetterlessLine(trimmedLine) || isTocLikeLine(trimmedLine)) {
    return false;
  }
  if (/[:?]$/.test(trimmedLine)) {
    return false;
  }
  if (isHeadingRefExclusion(trimmedLine) || endsWithHeadingExcludedVerb(trimmedLine)) {
    return false;
  }
  return isMostlyUpperCase(trimmedLine);
}

/**
 * `headingColon`-only: is `trimmedLine` a complete heading that can
 * TERMINATE a wrapped multi-line heading started by `isHeadingMergeLead`?
 * Requires an actual `:`/`?` terminator (unlike `classifyHeading` alone,
 * which also accepts a bare ALL-CAPS line with no terminator at all, e.g. a
 * genuine single-line heading like "İÇİNDEKİLER") plus everything
 * `classifyHeading` itself checks (reference/narration exclusions, ALL-CAPS
 * ratio, colon-stripping).
 */
function isHeadingMergeTail(trimmedLine) {
  if (!/[:?]$/.test(trimmedLine)) {
    return false;
  }
  return classifyHeading(trimmedLine, { headingColon: true }) !== null;
}

/**
 * `headingColon`-only pre-pass over a page's normalized text (still carrying
 * blank-line paragraph separators): find a section heading PDF layout
 * wrapped across physical lines and splice it into one
 * `MERGED_HEADING_MARKER`-prefixed physical line (lead text(s) + " " + the
 * tail's classified heading text, so a trailing `:` is stripped and a
 * trailing `?` is kept, matching `classifyHeading`).
 *
 * Starting from an ALL-CAPS lead line with no terminal `:`/`?`
 * (`isHeadingMergeLead`), look ahead for the terminator line
 * (`isHeadingMergeTail`), skipping over:
 *  - up to 2 blank lines and/or now-letterless lines left behind by
 *    `stripArabicScript` (the wrapped title's own lines can end up on either
 *    side of such a gap), and
 *  - at most 1 further un-terminated ALL-CAPS continuation line (a title
 *    wrapped across three physical lines rather than two).
 *
 * Every other line, including a lead line whose lookahead finds no valid
 * terminator (e.g. a wrapped table-of-contents row), passes through
 * unchanged.
 */
function mergeWrappedHeadingLines(normalizedText) {
  const lines = normalizedText.split('\n');
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (isHeadingMergeLead(trimmed)) {
      const leadParts = [trimmed];
      let j = i + 1;
      let skippedFiller = 0;
      let extraLeads = 0;

      while (j < lines.length) {
        const candTrimmed = lines[j].trim();
        if (candTrimmed === '' || isLetterlessLine(candTrimmed)) {
          if (skippedFiller >= 2) {
            break;
          }
          skippedFiller += 1;
          j += 1;
          continue;
        }
        if (extraLeads < 1 && isHeadingMergeLead(candTrimmed)) {
          leadParts.push(candTrimmed);
          extraLeads += 1;
          j += 1;
          continue;
        }
        break;
      }

      if (j < lines.length) {
        const nextTrimmed = lines[j].trim();
        const tailHeading = isHeadingMergeTail(nextTrimmed)
          ? classifyHeading(nextTrimmed, { headingColon: true })
          : null;
        if (tailHeading !== null) {
          out.push(`${MERGED_HEADING_MARKER}${leadParts.join(' ')} ${tailHeading}`);
          i = j + 1;
          continue;
        }
      }
    }

    out.push(lines[i]);
    i += 1;
  }

  return out.join('\n');
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
 * When a paragraph is classified as a heading, `unit.text` is the heading
 * text to carry forward (colon-stripped when `headingColon` applied) rather
 * than the raw paragraph.
 */
function buildUnits(pages, { headingColon = false } = {}) {
  const units = [];
  for (const { page, text } of pages) {
    const normalized = normalizePageText(text);

    if (!headingColon) {
      // Default path: byte-identical to the pre-existing behavior.
      const paragraphs = splitParagraphs(normalized);
      for (const paragraph of paragraphs) {
        const heading = classifyHeading(paragraph, { headingColon });
        if (heading !== null) {
          units.push({ page, text: heading, isHeading: true });
        } else {
          units.push({ page, text: paragraph, isHeading: false });
        }
      }
      continue;
    }

    // `headingColon` path: first splice together any section heading PDF
    // layout wrapped across physical lines (see `mergeWrappedHeadingLines`),
    // then scan each blank-line-delimited block for heading lines embedded
    // inside it (no blank line before/after) before falling back to the same
    // whole-block classification as the default path.
    const withMergedHeadings = mergeWrappedHeadingLines(normalized);
    const rawBlocks = splitParagraphBlocksRaw(withMergedHeadings);
    for (const rawBlock of rawBlocks) {
      const segments = splitEmbeddedHeadings(rawBlock, { headingColon });
      for (const segment of segments) {
        if (segment.isHeading) {
          units.push({ page, text: segment.text, isHeading: true });
          continue;
        }
        const heading = classifyHeading(segment.text, { headingColon });
        if (heading !== null) {
          units.push({ page, text: heading, isHeading: true });
        } else {
          units.push({ page, text: segment.text, isHeading: false });
        }
      }
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
 * @param {{headingColon?: boolean}} [options] `headingColon`: opt-in, default
 *   `false`. When true, (mostly) ALL-CAPS section titles ending with a single
 *   trailing colon or a question mark (e.g. "EVDEN ÇIKARKEN YAPILAN DUÂ:",
 *   "...NASIL TESBİH ÇEKERDİ?") are recognized as headings (colon stripped
 *   from the stored `sectionHeading`, `?` kept); a title PDF layout wrapped
 *   across two or three physical lines is spliced back into one; and
 *   source/hadith reference lines and narration lead-ins ("Buyurdu ki:") are
 *   never treated as headings. Leaving this `false` reproduces the exact
 *   prior behavior byte-for-byte.
 * @returns {{chunkIndex:number, text:string, pageStart:number, pageEnd:number, sectionHeading:string|null}[]}
 */
/**
 * headingColon yolunda: PDF'te başlığa yapışık kalan dipnot rakamını
 * ("...FAZÎLETİ2", "...DUÂ3") kırpar. Yalnızca bir harfin hemen ardından
 * gelen 1-2 haneli sondaki rakam silinir; "Sûresi: 255" gibi gerçek sayılar
 * bu yola zaten giremez (kaynak satırları başlık sayılmaz).
 */
function stripGluedFootnoteDigits(heading) {
  if (!heading) return heading;
  return heading.replace(/(\p{L})\d{1,2}$/u, '$1').trimEnd();
}

export function chunkPages(pages, options = {}) {
  const { headingColon = false } = options;
  const units = buildUnits(pages, { headingColon });

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
        sectionHeading: headingColon
          ? stripGluedFootnoteDigits(chunkHeadingAtStart)
          : chunkHeadingAtStart,
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
  splitParagraphBlocksRaw,
  splitEmbeddedHeadings,
  isHeadingCandidate,
  hasHeadingShape,
  stripSingleTrailingColon,
  classifyHeading,
  isHeadingRefExclusion,
  endsWithHeadingExcludedVerb,
  isMostlyUpperCase,
  isHeadingColonCandidate,
  isHeadingMergeLead,
  isHeadingMergeTail,
  mergeWrappedHeadingLines,
  splitSentences,
  tailOverlap,
  stripArabicScript,
  countArabicScriptChars,
  buildUnits,
};
