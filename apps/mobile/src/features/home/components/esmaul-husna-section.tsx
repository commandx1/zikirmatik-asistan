import { useThemeTokens } from '@zikirmatik/ui'
import { useMemo } from 'react'
import { Pressable, Text, View } from 'react-native'
import { ESMAUL_HUSNA } from '../../focus/data'
import type { EsmaulHusnaItem } from '../../focus/types'

type EsmaulHusnaTableEntry = {
  number: number
  item: EsmaulHusnaItem
}

type EsmaulHusnaSectionProps = {
  disabled?: boolean
  selectedTransliteration?: string
  onSelect: (item: EsmaulHusnaItem) => void
}

export function EsmaulHusnaSection({ disabled = false, selectedTransliteration, onSelect }: EsmaulHusnaSectionProps) {
  const { tokens } = useThemeTokens()

  const rows = useMemo(() =>
    ESMAUL_HUSNA.reduce<EsmaulHusnaTableEntry[][]>((acc, item, index) => {
      const rowIndex = Math.floor(index / 2)
      if (!acc[rowIndex]) acc[rowIndex] = []
      acc[rowIndex].push({ number: index + 1, item })
      return acc
    }, []),
  [])

  if (rows.length === 0) {
    return null
  }

  return (
    <View className='px-5 pb-1'>
      <View
        className='rounded-2xl px-4 py-3'
        style={{
          borderWidth: 1,
          borderColor: withAlpha(tokens.textPrimary, 0.12),
          backgroundColor: withAlpha(tokens.card, 0.92)
        }}
      >
        <Text className='mb-3 text-[11px] font-semibold uppercase tracking-[1.1px]' style={{ color: tokens.textMuted }}>
          Esmaül Hüsna
        </Text>
        <View className='overflow-hidden rounded-xl' style={{ borderWidth: 1, borderColor: withAlpha(tokens.textPrimary, 0.1) }}>
          {rows.map((row, rowIndex) => {
            const isLastRow = rowIndex === rows.length - 1

            return (
              <View
                key={rowIndex}
                className='min-h-10 flex-row'
                style={{
                  borderBottomWidth: isLastRow ? 0 : 1,
                  borderBottomColor: withAlpha(tokens.textPrimary, 0.08),
                  backgroundColor:
                    rowIndex % 2 === 0 ? withAlpha(tokens.textPrimary, 0.035) : withAlpha(tokens.textPrimary, 0.015)
                }}
              >
                {row.map(({ number, item }, cellIndex) => {
                  const isSelected = selectedTransliteration === item.transliteration

                  return (
                    <Pressable
                      key={item.transliteration}
                      disabled={disabled}
                      onPress={() => onSelect(item)}
                      className='flex-1 flex-row items-center px-3 py-2'
                      style={{
                        borderRightWidth: cellIndex === 0 ? 1 : 0,
                        borderRightColor: withAlpha(tokens.textPrimary, 0.08),
                        backgroundColor: isSelected ? withAlpha(tokens.accent, 0.14) : 'transparent',
                        opacity: disabled ? 0.64 : 1
                      }}
                    >
                      <Text className='w-6 text-xs font-semibold tabular-nums' style={{ color: tokens.textMuted }}>
                        {number}
                      </Text>
                      <Text className='flex-1 text-sm leading-5' style={{ color: tokens.textPrimary }}>
                        {item.transliteration}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            )
          })}
        </View>
      </View>
    </View>
  )
}

function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace('#', '')
  if (!(normalized.length === 6 || normalized.length === 8)) {
    return hex
  }

  const r = Number.parseInt(normalized.slice(0, 2), 16)
  const g = Number.parseInt(normalized.slice(2, 4), 16)
  const b = Number.parseInt(normalized.slice(4, 6), 16)

  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`
}
