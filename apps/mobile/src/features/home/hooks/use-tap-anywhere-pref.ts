import { useCallback, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { TAP_ANYWHERE_ENABLED_KEY } from '../../../lib/storage/keys'

export function useTapAnywherePref() {
  const [tapAnywhereEnabled, setTapAnywhereEnabled] = useState(false)

  useEffect(() => {
    void AsyncStorage.getItem(TAP_ANYWHERE_ENABLED_KEY).then(val => {
      if (val === '1') setTapAnywhereEnabled(true)
    })
  }, [])

  const toggleTapAnywhere = useCallback(() => {
    setTapAnywhereEnabled(prev => {
      const next = !prev
      void AsyncStorage.setItem(TAP_ANYWHERE_ENABLED_KEY, next ? '1' : '0')
      return next
    })
  }, [])

  return { tapAnywhereEnabled, toggleTapAnywhere }
}
