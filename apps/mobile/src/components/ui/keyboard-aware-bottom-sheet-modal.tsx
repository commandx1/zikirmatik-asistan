import { useEffect, useState, type ReactNode } from 'react'
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  View,
  type StyleProp,
  type ViewStyle
} from 'react-native'

type KeyboardAwareBottomSheetModalProps = {
  visible: boolean
  onRequestClose: () => void
  children: ReactNode
  animationType?: 'none' | 'slide' | 'fade'
  showHandle?: boolean
  overlayClassName?: string
  sheetClassName?: string
  sheetStyle?: StyleProp<ViewStyle>
  scrollContentContainerStyle?: StyleProp<ViewStyle>
  keyboardVerticalOffset?: number
}

export function KeyboardAwareBottomSheetModal({
  visible,
  onRequestClose,
  children,
  animationType = 'fade',
  showHandle = false,
  overlayClassName = 'flex-1 justify-end bg-black/50 px-4',
  sheetClassName = 'w-full rounded-t-3xl p-5',
  sheetStyle,
  scrollContentContainerStyle,
  keyboardVerticalOffset = 0
}: KeyboardAwareBottomSheetModalProps) {
  const [androidKeyboardHeight, setAndroidKeyboardHeight] = useState(0)

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const showSub = Keyboard.addListener('keyboardDidShow', (event) => {
      setAndroidKeyboardHeight(event.endCoordinates.height)
    })
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setAndroidKeyboardHeight(0)
    })

    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])

  const behavior = Platform.OS === 'ios' ? 'padding' : undefined

  return (
    <Modal visible={visible} transparent animationType={animationType} onRequestClose={onRequestClose}>
      <KeyboardAvoidingView
        className='flex-1'
        behavior={behavior}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <View className={overlayClassName} style={Platform.OS === 'android' ? { paddingBottom: androidKeyboardHeight } : undefined}>
          <View className={sheetClassName} style={[{ maxHeight: '88%' }, sheetStyle]}>
            <ScrollView
              keyboardShouldPersistTaps='handled'
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[{ paddingBottom: 12 }, scrollContentContainerStyle]}
            >
              {showHandle ? <View className='mb-4 h-1.5 w-12 self-center rounded-full bg-white/20' /> : null}
              {children}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
