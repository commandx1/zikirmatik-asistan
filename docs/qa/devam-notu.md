# Devam notu — QA turu sonrası (2026-10-09)

Önceki oturum: 2026-10-06 → 2026-10-08 davranış odaklı QA turu. Ayrıntılar: `docs/qa/kapanis-raporu.md` (sonuçlar, bug listesi, kapasite, yayın kontrol listesi), `docs/qa/kararlar.md` (tüm ürün kararları), `docs/qa/davranis-katalogu.md`, `docs/qa/yuk-raporu.md`, `docs/qa/detox-todo.md`. Hafıza: `qa-turu-2026-10`, `test-stratejisi-kararlari`, `atlas-flex-gecisi`, `render-keep-alive`.

## Git durumu (2026-10-09)
- Yerel `main` **38 commit önde, 1 geride** (`origin/main`'de `fdae538` = video oturumunun prod hotfix'i).
- `fdae538` ile yereldeki `2a61e2f` **aynı değişiklik** (sohbet kaynak satırı, `ai-chat.service.ts` + spec), farklı satır konumlarında.
- **Push öncesi:** `git pull --rebase origin main`. Rebase'de `2a61e2f` boşalıp düşmeli; çakışırsa origin sürümünü al. Sonra `apps/api/src/modules/ai-chat/ai-chat.service.spec.ts`'te test bloğunun **iki kez eklenmediğini** kontrol et ve API testlerini koş.
- **Hiçbir şey push edilmedi.** Push yalnız kullanıcının onayıyla.

## Sıradaki adımlar (sırayla)
1. **Son doğrulama koşusu** (son kodla, tek seferde) — kapanıştan sonra küçük değişiklikler geldi (istatistik kaynak dağılımı adet bazlı, eski uygulama uyumluluk düzeltmeleri, Mongoose returnDocument, grafik NaN), tam Detox/iOS bunlarla koşulmadı:
   - `pnpm db:test && pnpm --filter api test && pnpm test:e2e` + `cd apps/api && npx tsc --noEmit -p tsconfig.json`
   - `pnpm --filter @zikirmatik/shared test`
   - `pnpm --filter @zikirmatik/mobile test && pnpm --filter @zikirmatik/mobile typecheck && pnpm --filter @zikirmatik/mobile lint && npx eslint apps/mobile/e2e/*.js`
   - `pnpm --filter @zikirmatik/website test:web`
   - Detox Android tam süit (01–17 + 20-journey-*) — önce `pnpm --filter api build` ve Android release build; emülatör `-port 5554`, `adb root`, `caffeinate -dimsu &` (tuzaklar: hafıza `test-stratejisi-kararlari` son paragraflar, `apps/mobile/e2e/README.md`)
   - iOS: `pnpm --filter @zikirmatik/mobile test:detox:ios:smoke`
   - Koşu sırasında kullanıcı emülatör/video kaydı kullanmamalı.
2. **Rebase** (yukarıdaki not) + API testlerini tekrar koş.
3. **Yayın** — `docs/qa/kapanis-raporu.md` §4:
   - Kullanıcı Atlas `test` DB'de 4 salt-okur index sorgusunu çalıştırır (hepsi boş dönmeli).
   - Atlas Flex geçişi (kullanıcı kararı: gece; mongodump yok; kullanıcı söyleyene kadar Atlas'a dokunma).
   - **Önce API** (push → Render auto-deploy), `/health`, gerçek cihazda build 102 duman testi, 24–48 sa Better Stack izleme.
   - **Sonra mobil build 103+** (yeni uygulama eski API'de özel günler 401 alır — sıra zorunlu).
   - Yeni Render env değişkeni gerekmiyor.
4. **Elle kontroller:** Play lisans test hesabıyla satın alma + kredi paketi (otomatik testlerin dışında).

## Açık / ayrı işler
- M-16 satın alımları geri yükle · M-17 girişten sonra eylem devamı · M-18 misafir aktarım uyarı bandı · **M-20 çevrimdışı kayıt kuyruğu (öncelikli)**.
- Katalogun satır satır son güncellemesi (son sayım `f460d6d`).
- Öneri: mobil `x-app-version` başlığı; genel throttler.

## Çalışma kuralları (önceki oturumdan)
- CLAUDE.md yönlendirme kuralları (Opus yönetir, fast-worker/deep-reasoner yapar, her sonuç incelenir). Türkçe konuş.
- Commit doğrudan `main`; yalnız kendi dosyalarını stage'le. Ajanlar çalışırken önce `npx eslint --flag v10_config_lookup_from_file <api dosyaları>` sonra `git commit --no-verify`. zsh'de dosya listesini dizi değişkenle ver.
- `apps/promo-video` kullanıcının video işi — dokunma, QA commit'lerine ekleme.
- Prod'a (Render/Atlas) hiçbir test/yük gitmez; prod DB guard'ı gevşetilmez.
