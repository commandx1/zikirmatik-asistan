# Zikirmatik Asistan

V1 mobile foundation monorepo.

## Workspace

- `apps/mobile`: Expo Router + NativeWind tabanlı mobil uygulama
- `apps/api`: NestJS tabanlı sosyal kimlik doğrulama + guest merge backend API
- `packages/ui`: reusable primitive/composite UI bileşenleri
- `packages/shared`: ortak tipler, helper fonksiyonlar, mock veriler

## Scripts

- `pnpm dev`: tüm workspace dev task
- `pnpm typecheck`: tüm paketlerde TS doğrulama
- `pnpm test`: unit testler
- `pnpm parity:check`: `docs/design/parity-map.json` referansına göre screenshot diff gate

## Backend Auth API

- `POST /v1/auth/provider/verify` (`provider`, `idToken`, `platform`, `deviceId`)
- `POST /v1/auth/refresh` (`refreshToken`)

## Pixel Parity Akışı

1. `docs/design` altındaki referans PNG'ler hedef görüntüdür.
2. Uygulama ekran screenshot'larını `artifacts/parity/current/*.png` yoluna koy.
3. `pnpm parity:check` çalıştır.
4. Fail durumunda diff dosyaları `artifacts/parity/diff/*.png` altında oluşur.

## Not

NativeWind v5 preview kullanılmaktadır. Expo/React Native sürümleri NativeWind stable v5 çıktısına geçildiğinde güncellenecektir.
