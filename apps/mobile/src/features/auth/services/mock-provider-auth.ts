import type { AuthProvider } from '@zikirmatik/shared';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { i18n } from '../../../i18n';
import {
  AUTH_SIMULATE_PROVIDER_OUTAGE,
  DEV_GOOGLE_EMAIL,
  DEV_GOOGLE_NAME,
  DEV_GOOGLE_SUB,
  E2E_MOCK_AUTH,
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_WEB_CLIENT_ID,
} from '../../../lib/env';

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
  if (AUTH_SIMULATE_PROVIDER_OUTAGE) {
    throw new ProviderAuthError(
      'transient',
      i18n.t('auth:errors.providerOutage'),
    );
  }

  if (provider === 'apple') {
    return requestAppleIdentityToken();
  }

  return requestGoogleIdentityToken();
}

export async function clearProviderSession(provider: AuthProvider) {
  if (provider !== 'google') {
    return;
  }

  const webClientId = resolveGoogleWebClientId();
  if (!webClientId) {
    return;
  }

  // iOS'ta iosClientId (ya da GoogleService-Info.plist) yoksa native
  // `configure` asenkron olarak reddeder ve bu JS'ten yakalanamaz (RedBox /
  // unhandled promise). Çıkış best-effort olduğundan Google oturumu
  // temizliğini tamamen atla; yerel oturum yine kapanır.
  if (Platform.OS === 'ios' && !resolveGoogleIosClientId()) {
    return;
  }

  const google = await loadGoogleSignInModule();
  if (!google) {
    return;
  }

  const { GoogleSignin } = google;

  configureGoogleSignIn(GoogleSignin);

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
    throw new ProviderAuthError('terminal', i18n.t('auth:errors.appleIosOnly'));
  }

  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) {
    throw new ProviderAuthError(
      'terminal',
      i18n.t('auth:errors.appleUnavailable'),
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
        i18n.t('auth:errors.appleTokenMissing'),
      );
    }

    return credential.identityToken;
  } catch (error) {
    if (error instanceof ProviderAuthError) {
      throw error;
    }

    if (isCancelError(error)) {
      throw new ProviderAuthError('terminal', i18n.t('auth:errors.signInCancelled'));
    }

    throw new ProviderAuthError(
      'transient',
      i18n.t('auth:errors.appleUnexpected'),
    );
  }
}

async function requestGoogleIdentityToken() {
  if (__DEV__ || E2E_MOCK_AUTH) {
    return buildDevGoogleIdentityToken();
  }

  const webClientId = resolveGoogleWebClientId();
  if (!webClientId) {
    throw new ProviderAuthError(
      'terminal',
      i18n.t('auth:errors.googleWebClientIdMissing'),
    );
  }

  const androidClientId = resolveGoogleAndroidClientId();
  const iosClientId = resolveGoogleIosClientId();
  if (Platform.OS === 'ios' && !iosClientId) {
    throw new ProviderAuthError(
      'terminal',
      i18n.t('auth:errors.googleIosClientIdMissing'),
    );
  }

  const google = await loadGoogleSignInModule();
  if (!google) {
    throw new ProviderAuthError(
      'terminal',
      i18n.t('auth:errors.googleModuleMissing'),
    );
  }

  const { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } = google;

  configureGoogleSignIn(GoogleSignin);

  try {
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
    }

    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) {
      throw new ProviderAuthError('terminal', i18n.t('auth:errors.signInCancelled'));
    }

    const idToken = response.data.idToken;
    if (!idToken) {
      throw new ProviderAuthError(
        'terminal',
        i18n.t('auth:errors.googleIdTokenMissing'),
      );
    }

    return idToken;
  } catch (error) {
    if (error instanceof ProviderAuthError) {
      throw error;
    }

    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new ProviderAuthError('terminal', i18n.t('auth:errors.signInCancelled'));
      }

      if (error.code === statusCodes.IN_PROGRESS) {
        throw new ProviderAuthError(
          'transient',
          i18n.t('auth:errors.googleInProgress'),
        );
      }

      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new ProviderAuthError(
          'terminal',
          i18n.t('auth:errors.googlePlayServicesUnavailable'),
        );
      }
    }

    const diagnostic = formatGoogleAuthDiagnostic(error);
    const configSummary = formatGoogleClientConfigSummary({
      webClientId,
      androidClientId,
      iosClientId,
    });
    if (diagnostic) {
      throw new ProviderAuthError(
        'transient',
        i18n.t('auth:errors.googleErrorWithDiagnostic', { diagnostic, configSummary }),
      );
    }

    throw new ProviderAuthError(
      'transient',
      i18n.t('auth:errors.googleUnexpected', { configSummary }),
    );
  }
}

function resolveGoogleWebClientId() {
  return GOOGLE_WEB_CLIENT_ID;
}

function resolveGoogleAndroidClientId() {
  return GOOGLE_ANDROID_CLIENT_ID;
}

function resolveGoogleIosClientId() {
  return GOOGLE_IOS_CLIENT_ID;
}

async function loadGoogleSignInModule() {
  try {
    return await import('@react-native-google-signin/google-signin');
  } catch {
    return null;
  }
}

function configureGoogleSignIn(
  GoogleSignin: NonNullable<
    Awaited<ReturnType<typeof loadGoogleSignInModule>>
  >['GoogleSignin'],
) {
  const webClientId = resolveGoogleWebClientId();
  const androidClientId = resolveGoogleAndroidClientId();
  const iosClientId = resolveGoogleIosClientId();

  GoogleSignin.configure({
    webClientId,
    ...(androidClientId ? { androidClientId } : {}),
    ...(iosClientId ? { iosClientId } : {}),
    offlineAccess: false,
  });
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

function formatGoogleAuthDiagnostic(error: unknown) {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const candidate = error as { code?: unknown; message?: unknown };
  const code =
    typeof candidate.code === 'string' && candidate.code.trim()
      ? candidate.code.trim()
      : undefined;
  const message =
    typeof candidate.message === 'string' && candidate.message.trim()
      ? candidate.message.trim()
      : undefined;

  if (code && message) {
    return `${code}: ${message}`;
  }

  return code ?? message;
}

function formatGoogleClientConfigSummary({
  webClientId,
  androidClientId,
  iosClientId,
}: {
  webClientId: string;
  androidClientId?: string;
  iosClientId?: string;
}) {
  return [
    `webClientId=${maskGoogleClientId(webClientId)}`,
    `androidClientId=${maskGoogleClientId(androidClientId)}`,
    `iosClientId=${maskGoogleClientId(iosClientId)}`,
  ].join(', ');
}

function buildDevGoogleIdentityToken() {
  // Neutral defaults; set EXPO_PUBLIC_DEV_GOOGLE_* to sign in as a specific user.
  const email = DEV_GOOGLE_EMAIL || 'dev@example.com';
  const displayName = DEV_GOOGLE_NAME || 'Dev User';
  const stableSub = DEV_GOOGLE_SUB || `dev-google-${email}`;

  return JSON.stringify({
    sub: stableSub,
    email,
    name: displayName,
  });
}

function maskGoogleClientId(value?: string) {
  if (!value) {
    return 'yok';
  }

  if (value.length <= 12) {
    return value;
  }

  return `${value.slice(0, 12)}...`;
}
