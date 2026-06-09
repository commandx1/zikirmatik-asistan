export type ZikirFilterKey = 'all' | 'active' | 'completed' | 'favorites'
export type ZikirSource = 'ready' | 'personal'

export type AiDhikrContext = {
  dhikrId: string
  recommendationId: string
  prompt: string
  assistantNote?: string
}

export type ZikirItem = {
  id: string
  source: ZikirSource
  nameTurkish: string
  arabic?: string
  transliteration: string
  meaning?: string
  virtue?: string
  contentSource?: string
  aiPrompt?: string
  aiAssistantNote?: string
  aiRecommendationId?: string
  current: number
  target: number
  lastActivityLabel: string
  streakDays: number
  isFavorite: boolean
}

export type EsmaulHusnaItem = {
  nameArabic: string // الرَّحْمَنُ
  transliteration: string // Er-Rahmân
  meaning: string // Tüm isim ve sıfatları kendinde toplayan, eşi benzeri bulunmayan tek ilah. 
  virtue: string // Derecenin hem Allah hem insanlar katında artması; sevilen, sayılan, sözü geçen biri olmak; her türlü şeytan ve nefis şerrinden korunmak; uykuda meleklerin yardımına nail olmak. 
  dhikrDay: string // Pazar
}
