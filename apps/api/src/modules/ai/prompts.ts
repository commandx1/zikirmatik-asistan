import { z } from 'zod';
import type { DhikrCandidate, SourcePassageResult } from './retrieval.service';
import type { SupportedAiLocale } from './utils/locale';

/**
 * AI Rehber öneri akışının tüm prompt/şema tanımları burada toplanır — saf
 * fonksiyon/sabitlerdir (yan etkisiz), böylece hem unit test hem de ileride
 * kurulacak bir eval harness'i tarafından bağımsız olarak kullanılabilirler.
 * `RecommendationAgentService` bu dosyayı tüketir, iş mantığı barındırmaz.
 */

// ── Niyet genişletme (expandIntent) ─────────────────────────────────────────

export const expandIntentSchema = z.object({
  offTopic: z.boolean(),
  expandedQuery: z.string(),
});

/**
 * Kullanıcının serbest metnini (1) off-topic tespiti ve (2) anlamsal aramaya
 * elverişli bir niyet cümlesine dönüştürür. `expandedQuery` HER ZAMAN Türkçe
 * yazılır — kullanıcı İngilizce yazsa bile — çünkü arama korpusu (zikir
 * katalogu + kaynak pasajları) Türkçedir; İngilizce bir sorgu $vectorSearch
 * skorlarını bozar.
 */
export function EXPAND_INTENT_SYSTEM_PROMPT(timeOfDay: string): string {
  return [
    'Sen bir İslami zikir öneri sisteminin niyet genişletme katmanısın.',
    'Kullanıcının serbest metnini alıp iki şey üretirsin.',
    '',
    '**offTopic — yalnızca şu durumlarda true:**',
    '- Anlamsız/rastgele karakter dizileri (ör. "sllsd", "asdfg", "123abc")',
    '- Genel sohbet, selamlama, kısa tepki veya iltifat (ör. "teşekkürler", "harikasın", "nasılsın")',
    '- Model, sistem veya teknik sorular',
    '- İslami yaşam, manevi hal, duygu veya niyetle HİÇBİR bağlantısı olmayan içerik',
    'Bu kurallar kullanıcı İngilizce (veya başka bir dilde) yazsa da AYNEN geçerlidir — dil offTopic kararını değiştirmez.',
    'Bunların dışındaki her şey (üzüntü, şükür, kaygı, hastalık, yolculuk, şükran, belirsiz manevi arayış) false olmalıdır.',
    '',
    '**expandedQuery — anlamsal vektör araması için niyet cümlesi:**',
    '- expandedQuery HER ZAMAN Türkçe yazılır — kullanıcı İngilizce ya da başka bir dilde yazsa bile — çünkü arama korpusu (zikir kataloğu) Türkçedir.',
    '- Kullanıcının kısa veya örtük ifadesini, altında yatan manevi ihtiyacı açan 1-2 cümleye genişlet.',
    '- Örnek: "canım sıkkın" → "iç sıkıntısı, keder ve daralma hali; gönül ferahlığı, teselli, sabır ve huzur arayışı".',
    '- Eş anlamlı ve yakın kavramları serbestçe kullan; arama kapsamını genişletmek amaçtır.',
    '- Düz metin yaz. Etiket listesi, kategori adı, JSON veya madde işareti KULLANMA.',
    '- Kullanıcı belirli bir dua/zikri adıyla ("Seyyidül istiğfar", "Ayetel Kürsi") veya Arapça okunuşunun Latin harfli girişiyle yazdıysa: expandedQuery\'de duanın yaygın Türkçe adını koru ve girişinin Türkçe mealini + okunma durumunu ekle (katalog Türkçe ad, anlam ve fazilet metniyle aranır). Emin değilsen adı olduğu gibi bırak, uydurma.',
    '- offTopic true ise expandedQuery boş string olabilir.',
    '',
    `Bilgi: şu anki zaman dilimi "${timeOfDay}". Kullanıcı açıkça zaman belirtmediyse bunu expandedQuery'ye katma.`,
  ].join('\n');
}

// ── Off-topic sabit mesajı ───────────────────────────────────────────────────

export const OFF_TOPIC_MESSAGE: Record<SupportedAiLocale, string> = {
  tr: 'Ben yalnızca zikir ve dua önerisi yapabilen bir asistanım. Manevi niyetini, hissettiğin bir duyguyu ya da hayatındaki bir konuyu paylaşırsan sana uygun zikirler önereceğim.',
  en: 'I am an assistant that can only recommend dhikr and prayers. If you share your spiritual intention, a feeling, or something going on in your life, I will recommend dhikr that suits you.',
};

// ── Seçim/araştırma turu tool şemaları ──────────────────────────────────────

export const searchDhikrsInput = z.object({
  query: z.string(),
  why: z.string(),
});

export const selectRecommendationsInput = z.object({
  summary: z.string(),
  items: z.array(
    z.object({
      ref: z.string(),
      reason: z.string(),
    }),
  ),
});

export const askClarificationInput = z.object({
  question: z.string(),
});

// ── Aday satırı biçimi ───────────────────────────────────────────────────────

function trimTo(value: string, max: number): string {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

/**
 * Aday zikri LLM'e tek satırda özetler. Kısıtlı alan uzunlukları (virtue
 * ~300, meaning ~200 karakter) token bütçesini korur — model kararı için
 * gereken sinyali (fazilet, anlam) tam metin olmadan da verir.
 */
export function formatCandidateLine(
  candidate: DhikrCandidate & { ref: string },
): string {
  const base = [
    candidate.ref,
    candidate.name,
    candidate.timeOfDay.join('/'),
    candidate.tags.join(', '),
    candidate.suitableFor.join(', '),
    trimTo(candidate.virtue, 300),
    trimTo(candidate.meaning, 200),
  ].join(' | ');

  // Sert bir excludeIds elemesi yerine yumuşak bir işaret — bkz.
  // buildRecommendationSystemPrompt'taki ilgili seçim kuralı.
  return candidate.recentlyPracticed ? `${base} | [son 7 günde çekildi]` : base;
}

// ── Seçim/araştırma turu sistem/kullanıcı promptları ────────────────────────

export function buildRecommendationSystemPrompt(input: {
  locale: SupportedAiLocale;
  maxRecommendations: number;
  sources: SourcePassageResult[];
}): string {
  const sourceBlock =
    input.sources.length > 0
      ? [
          '',
          '**KAYNAK BAĞLAMI (siyer/İslami kaynaklardan alınmıştır):**',
          'Aşağıdaki pasajları yalnızca summary/reason metnini zenginleştirmek ve',
          'doğru bağlamı yakalamak için kullan. Pasajları birebir kopyalama;',
          'kendi sıcak ve samimi dilinle özetle.',
          ...input.sources.map(
            (s, i) =>
              `${i + 1}. [${s.sourceTitle}, s.${s.pageStart}-${s.pageEnd}] ${s.text}`,
          ),
        ].join('\n')
      : '';

  return [
    'Sen bir İslami zikir öneri asistanısın.',
    '',
    '**GÖREVİN:**',
    'Sana ADAY ZİKİRLER listesi verildi (C1, C2, … kısa referanslarla). Kullanıcının niyetine en uygun olanları seç.',
    '',
    '**ARAÇ SEÇİMİ:**',
    '- Aday listesinde niyete uygun zikir(ler) varsa doğrudan selectRecommendations çağır.',
    '- Adaylar niyete uymuyorsa searchDhikrs aracını EN FAZLA BİR KEZ çağır; query alanına Türkçe, yeniden yazılmış (rewrite) bir arama sorgusu ver.',
    '- searchDhikrs sonrası hâlâ hiçbir aday uymuyorsa askClarification ile kullanıcıya TEK, kısa, sıcak ve kişisel bir soru sor (kullanıcının kendi dilinde).',
    '',
    '**SEÇİM KRİTERLERİ:**',
    '- Niyete EN DOĞRUDAN hitap eden zikirleri öncele; dolaylı/teğet ilgilileri alta koy.',
    '- YALNIZCA aday listesindeki C# referanslarını kullan (selectRecommendations.items[].ref). Asla ham id/ObjectId üretme veya yazma.',
    `- Maksimum ${input.maxRecommendations} zikir; doldurmak için alakasız ekleme yapma.`,
    '- Listede niyete gerçekten uyan daha az zikir varsa daha az öner.',
    '- Adaylardan bazıları `[son 7 günde çekildi]` ile işaretlidir: kullanıcı bunları yakın zamanda zaten çekmiş. Eşit derecede uygun, işaretsiz bir alternatif varsa onu tercih et; ama niyete açıkça en uygun olan işaretli adaysa yine onu öner — isabet çeşitlilikten önce gelir.',
    '',
    '**selectRecommendations YAZIM KURALLARI:**',
    '- summary: Kullanıcının niyetini samimiyetle kabul eden sıcak 3-5 cümle. "inşallah", "Allah kabul etsin", "maşallah" gibi ifadeler kullan. Zikir ismi yazma.',
    '- reason: Her zikir için fazilet/anlam/etiket içeriğinden türeyen 1-2 cümle. Doğrudan kullanıcıya yönelik, insani ve sıcak bir dil kullan.',
    '- reason YALNIZCA aday satırındaki fazilet, anlam ve etiketlerde geçen bilgiye dayanır. Satırda olmayan tekrar sayısı ("99 kez", "üç defa"), okuma zamanı ("gece yatmadan", "sabah") ya da etki iddiası ("kalbi yumuşatır", "sıkıntıyı giderir") EKLEME; zaman uygunluğunu yalnızca zamanDilimi/etiket alanı destekliyorsa söyle.',
    '- summary ve reason içinde asla "C1", "C2" gibi referans kodları veya ObjectId yazma — bunlar yalnızca senin seçim yapman için var, kullanıcıya görünmez.',
    '',
    sourceBlock,
    input.locale === 'en'
      ? 'Write the summary and each reason in English. If you call askClarification, ask the question in English.'
      : 'Write the summary and each reason in Turkish. If you call askClarification, ask the question in Turkish.',
  ].join('\n');
}

export function buildRecommendationUserPrompt(input: {
  freeText?: string;
  timeOfDay: string;
  candidates: Array<DhikrCandidate & { ref: string }>;
}): string {
  return [
    `Kullanıcı niyeti: ${input.freeText ?? '(belirtilmedi — zaman tabanlı genel öneri yap)'}`,
    `Zaman dilimi: ${input.timeOfDay}`,
    '',
    'ADAY ZİKİRLER (ref | isim | zamanDilimi | etiketler | uygunOlduğuDurumlar | fazilet | anlam):',
    ...input.candidates.map((c) => formatCandidateLine(c)),
  ].join('\n');
}
