import type { AuthProvider } from '@zikirmatik/shared';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

export class ProviderAuthError extends Error {
  constructor(
    public readonly kind: 'transient' | 'terminal',
    message: string,
  ) {
    super(message);
    this.name = 'ProviderAuthError';
  }
}

export async function requestProviderIdToken(provider: AuthProvider) {
  if (process.env.EXPO_PUBLIC_AUTH_SIMULATE_PROVIDER_OUTAGE === '1') {
    throw new ProviderAuthError(
      'transient',
      'Kimlik sağlayıcısına şu an ulaşılamıyor. Bağlantını kontrol edip tekrar deneyebilirsin.',
    );
  }

  if (provider === 'apple') {
    return requestAppleIdentityToken();
  }

  return requestGoogleIdentityToken();
}

export async function clearProviderSession(provider: AuthProvider) {
  if (provider !== 'google' || Platform.OS !== 'android') {
    return;
  }

  const webClientId = resolveGoogleWebClientId();
  if (!webClientId) {
    return;
  }

  const google = await loadGoogleSignInModule();
  if (!google) {
    return;
  }

  const { GoogleSignin } = google;

  GoogleSignin.configure({
    webClientId,
    offlineAccess: false,
  });

  try {
    const hasPreviousSignIn = GoogleSignin.hasPreviousSignIn();
    if (!hasPreviousSignIn) {
      return;
    }
  } catch {
    return;
  }

  try {
    await GoogleSignin.revokeAccess();
  } catch {
    // Best effort only: logout should continue even if revoke fails.
  }

  try {
    await GoogleSignin.signOut();
  } catch {
    // Best effort only: local session is already cleared by auth store.
  }
}

async function requestAppleIdentityToken() {
  if (Platform.OS !== 'ios') {
    throw new ProviderAuthError('terminal', 'Apple girişi sadece iOS için kullanılabilir.');
  }

  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) {
    throw new ProviderAuthError(
      'terminal',
      'Bu cihazda Apple ile Giriş kullanılamıyor.',
    );
  }

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new ProviderAuthError(
        'terminal',
        'Apple kimlik doğrulama tokenı alınamadı.',
      );
    }

    return credential.identityToken;
  } catch (error) {
    if (error instanceof ProviderAuthError) {
      throw error;
    }

    if (isCancelError(error)) {
      throw new ProviderAuthError('terminal', 'Giriş işlemi iptal edildi.');
    }

    throw new ProviderAuthError(
      'transient',
      'Apple ile giriş sırasında beklenmeyen bir hata oluştu.',
    );
  }
}

async function requestGoogleIdentityToken() {
  if (Platform.OS !== 'android') {
    throw new ProviderAuthError(
      'terminal',
      'Google girişi bu platformda etkin değil.',
    );
  }

  const webClientId = resolveGoogleWebClientId();
  if (!webClientId) {
    throw new ProviderAuthError(
      'terminal',
      'Google web client id bulunamadı. EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID değerini ayarla.',
    );
  }

  const google = await loadGoogleSignInModule();
  if (!google) {
    throw new ProviderAuthError(
      'terminal',
      'Google Sign-In native modülü bulunamadı. Expo Go yerine development build ile açmalısın.',
    );
  }

  const { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } = google;

  GoogleSignin.configure({
    webClientId,
    offlineAccess: false,
  });

  try {
    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });

    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) {
      throw new ProviderAuthError('terminal', 'Giriş işlemi iptal edildi.');
    }

    const idToken = response.data.idToken;
    if (!idToken) {
      throw new ProviderAuthError(
        'terminal',
        'Google id_token alınamadı. Web client id ayarını kontrol et.',
      );
    }

    return idToken;
  } catch (error) {
    if (error instanceof ProviderAuthError) {
      throw error;
    }

    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new ProviderAuthError('terminal', 'Giriş işlemi iptal edildi.');
      }

      if (error.code === statusCodes.IN_PROGRESS) {
        throw new ProviderAuthError(
          'transient',
          'Google giriş işlemi zaten devam ediyor.',
        );
      }

      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new ProviderAuthError(
          'terminal',
          'Google Play Services kullanılamıyor.',
        );
      }
    }

    throw new ProviderAuthError(
      'transient',
      'Google ile giriş sırasında beklenmeyen bir hata oluştu.',
    );
  }
}

function resolveGoogleWebClientId() {
  return process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
}

async function loadGoogleSignInModule() {
  try {
    return await import('@react-native-google-signin/google-signin');
  } catch {
    return null;
  }
}

function isCancelError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as { code?: unknown; message?: unknown };
  return (
    candidate.code === 'ERR_REQUEST_CANCELED' ||
    (typeof candidate.message === 'string' &&
      candidate.message.toLowerCase().includes('cancel'))
  );
}
