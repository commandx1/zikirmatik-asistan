# G3 — Yasal Metinler İngilizce Taslağı (Gizlilik, Kullanım Şartları, İade, Hesap Silme)

> TASLAK. Her bölümün `Onay` hücresi boş; sen onaylamadan hiçbiri yayına girmez. Kaynak: `apps/website/src/messages/tr.json` (güncel) ve `en.json` (eski). İngilizce metin Türkçenin bölüm bölüm sadık çevirisidir; Türkçede olmayan hukuki iddia eklenmedi. E-posta yerine `{{SUPPORT_EMAIL}}` yer tutucusu kullanıldı. Son güncelleme tarihi Türkçede "28 Eylül 2026"; İngilizce karşılığı: "Last updated: {{DATE}}" (yayın tarihinde doldurulacak).

## 0. Eski İngilizce ile güncel Türkçe arasındaki farklar (kısa özet)

| Yer | Eski EN | Güncel TR (bu taslağın esası) |
|---|---|---|
| Son güncelleme | July 22, 2026 | 28 Eylül 2026 |
| Gizlilik §1 | Yalnız Google ile giriş; "vird programları" yok | Google veya Apple; "vird programlarınız" eklendi |
| Gizlilik §2 | "when you sign in with Google" | Aynı; Apple girişi §3'te ele alınıyor (§2 metni Google diyor) |
| Gizlilik §3 başlık ve metin | "Google Sign-In"; Google şifresi | "Google veya Apple ile Giriş"; "Şifrenize erişimimiz yoktur"; erişim Google veya Apple ayarlarından iptal edilir |
| Gizlilik §5 | Zikir Halkası cümlesi yok | Halka'ya katılınca görünen ad ve katkı, diğer üyelere ve kurucuya gösterilir |
| Şartlar başlık | "Terms of Service" | "Kullanım Şartları" (bu taslakta: Terms of Use) |
| Şartlar §2 | Sayaç, koleksiyonlar, hatırlatıcılar, seri, Google senkronizasyonu, AI Rehber | Sayaç ve kütüphane, günlük vird, zikir halkası, AI Rehber ve kaynaklı sohbet, özel gün bildirimleri, istatistik ve rozetler, widget'lar, Google/Apple senkronizasyonu, Premium abonelik ve kredi paketleri |
| Şartlar §3 | Yalnız Google | Google veya Apple |
| Şartlar §4 başlık ve metin | "Premium Credits and Purchases"; abonelik yok | "Premium Abonelik, Krediler ve Satın Alımlar": aylık veya yıllık otomatik yenilenen abonelik, iptal Google Play "Abonelikler" bölümünden |
| Şartlar §4 kredi | Ücretsiz günde 1 (+3 bonus), Premium ayda 50 | Aynı |
| İade intro | Yalnız kredi satın alımları | Premium abonelik ve kredi satın alımları |
| İade §1 | Yalnız kredi paketleri; iadeler Google Play politikasına tabi | Abonelikler dahil; abonelik iptali Google Play "Abonelikler"den; iadeler Google Play'in abonelik iade politikasına tabi |
| Diğer bölümler | — | Anlamca aynı |

## 1. Destek e-postası uyumsuzluğu

Web sitesi `apps/website/src/lib/constants.ts` içindeki `CONTACT_EMAIL` adresini (`serhatbelen7.developer@gmail.com`) kullanıyor; uygulama ise `apps/mobile/src/features/profile/hooks/use-profile.ts` içinde `support@zikirmatik.app` adresini kullanıyor. Taslaklarda `{{SUPPORT_EMAIL}}` kullanıldı.

| Kullanılacak destek e-postası | Karar |
|---|---|
| serhatbelen7.developer@gmail.com (site sabiti; zikirmatik.app alan adı sahipli değil) | |

## 2. Privacy Policy (draft)

Onay: kabul (Opus, 2026-09-30, kullanıcı yetkisiyle)

**Privacy Policy**

Last updated: {{DATE}}

This Privacy Policy explains how Zikirmatik Asistan ("we", "our app") collects, uses, discloses and protects your information when you use the mobile application.

**1. Information We Collect**
We collect information you provide directly, such as your dhikr collections, wird programs, custom targets and preferences, and, if you choose to sign in with Google or Apple, the basic account information (name, email address and profile identifier) shared by the relevant provider. We also collect usage information such as streaks, counts and app settings that are needed to provide the app's features, and technical information such as device type, operating system version and crash diagnostics to keep the app reliable.

**2. How We Use Your Information**
We use the information we collect to operate and improve the app, to securely back up and sync your collections, streaks and settings across your devices when you sign in with Google, to send the reminders and notifications you configure (including daily targets and special-day/Kandil notifications), to process optional Premium credit purchases through Google Play, and to provide customer support when you contact us.

**3. Signing In with Google or Apple**
If you choose to sign in with Google or Apple, we receive limited profile information from the relevant provider (such as your name, email address and profile identifier) in order to create and secure your account and to sync your data across devices. We do not have access to your password, and you can revoke this access at any time from your Google or Apple account settings.

**4. Data Storage and Security**
Your data is stored using industry-standard security practices, including encryption in transit. We keep your account data for as long as your account is active or as long as it is needed to provide the app's features, and we take reasonable technical and organizational measures to protect it against unauthorized access, alteration or loss.

**5. Data Sharing**
We do not sell your personal information. We may share limited information with trusted service providers that help us operate the app (such as cloud hosting, authentication and payment processing through Google Play), only to the extent necessary for them to perform their services or where required by law. When you join a Dhikr Circle, your display name and your contribution to the circle are shown to the other members of that circle and to its founder.

**6. Notifications**
The app may send local and push notifications for the daily dhikr reminders you configure and for special-day/Kandil occasions. You can manage or turn off notifications at any time from your device settings.

**7. Your Rights and Choices**
You can access, update or delete the dhikr collections and settings stored in the app at any time. You can contact us at {{SUPPORT_EMAIL}} to request deletion of your account and associated data, or to ask questions about how your data is handled. We will respond to and process such requests within a reasonable time.

**8. Children's Privacy**
Zikirmatik Asistan is not directed at children under the age of 13, and we do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us so that we can remove it.

**9. Changes to This Policy**
We may update this Privacy Policy from time to time to reflect changes in the app or in applicable law. When we make changes, we update the "Last updated" date above, and we recommend that you review this page periodically.

**10. Contact Us**
If you have questions about this Privacy Policy or about how your data is handled, please contact us at {{SUPPORT_EMAIL}}.

## 3. Terms of Use (draft)

Onay: kabul (Opus, 2026-09-30, kullanıcı yetkisiyle)

**Terms of Use**

Last updated: {{DATE}}

These Terms of Use ("Terms") govern your access to and use of the Zikirmatik Asistan mobile application (the "App"). By downloading, accessing or using the App, you agree to be bound by these Terms.

**1. Acceptance of the Terms**
By installing or using Zikirmatik Asistan, you confirm that you have read, understood and accepted these Terms. If you do not accept them, please do not use the App.

**2. Description of the Service**
Zikirmatik Asistan offers a dhikr counter and library, a daily wird program, dhikr circles, AI Rehber and sourced chat, special-day notifications, statistics and badges, home screen widgets, optional Google or Apple sync, and Premium subscriptions and credit packs.

**3. Accounts**
Signing in with Google or Apple is optional. If you choose to sign in, you are responsible for keeping your account private and for all activity that takes place through your account. You can sign out or revoke access at any time.

**4. Premium Subscription, Credits and Purchases**
Premium is purchased through Google Play as a monthly or annual subscription, renews automatically, and can be cancelled at any time from the "Subscriptions" section of the Google Play app. For the AI Rehber feature, the App also provides free users with 1 credit per day (with a welcome bonus of 3 credits on the first day) and Premium subscribers with 50 credits per month; in addition, one-time packs of 10, 30 or 75 credits can optionally be purchased. All purchases are processed through Google Play and are subject to Google Play's payment terms and policies. For details on requesting a refund, see our Refund Policy.

**5. Acceptable Use**
You agree to use the App only for lawful purposes and in accordance with these Terms. Except where permitted by applicable law, you may not reverse engineer, decompile or extract the source code of the App, and you may not use the App in a way that could disable, overload or impair its functionality.

**6. Intellectual Property**
The App, including its design, content, brand and features, belongs to us or our licensors and is protected by applicable intellectual property laws. These Terms do not give you any ownership rights in the App.

**7. Reminders and Notifications**
Notifications and reminders provided by the App (including daily targets and special-day/Kandil notifications) are offered as a convenience. We do not guarantee that they will be delivered at a particular time, because delivery may depend on your device settings, operating system and network conditions.

**8. Disclaimer of Warranties**
The App is provided "as is" and "as available", without any express or implied warranty. We do not guarantee that the App will be uninterrupted, error-free or completely accurate at all times.

**9. Limitation of Liability**
To the maximum extent permitted by law, we will not be liable for any indirect, incidental or consequential damages arising from your use of, or inability to use, the App.

**10. Changes to the Terms**
We may update these Terms from time to time. Continuing to use the App after changes take effect means that you accept the updated Terms. We update the "Last updated" date when changes are made.

**11. Termination**
If you breach these Terms, we may suspend or terminate your access to the App. You can stop using the App and delete your account at any time by contacting us.

**12. Contact Us**
If you have questions about these Terms, please contact us at {{SUPPORT_EMAIL}}.

## 4. Refund Policy (draft)

Onay: kabul (Opus, 2026-09-30, kullanıcı yetkisiyle)

**Refund Policy**

Last updated: {{DATE}}

This Refund Policy explains how refund requests are handled for Premium subscriptions and optional credit purchases made within Zikirmatik Asistan.

**1. Purchases Through Google Play**
All purchases, including Premium subscriptions and Premium credit packs (10, 30 or 75 credits), are processed and billed through Google Play. Subscription cancellations are made from the "Subscriptions" section of the Google Play app, and refunds are subject to Google Play's subscription refund policy.

**2. How to Request a Refund**
To request a refund, you can (a) use Google Play's own refund request process from your Google Play purchase history, which is the fastest method for eligible recent purchases, or (b) contact us directly at {{SUPPORT_EMAIL}} with your purchase details (order ID, purchase date and the credit pack purchased) so that we can help you or forward your request to Google Play when necessary.

**3. Eligibility**
Refund eligibility generally depends on how recently the purchase was made and on whether the purchased credits have been used before. We reserve the right to evaluate refund requests case by case, consistent with Google Play's policies and applicable consumer protection laws.

**4. Unused Credits**
Purchased AI Rehber credits that have not yet been used are generally considered more suitable for a refund than credits that have already been consumed. If you believe a purchase was made by mistake, please contact us as soon as possible.

**5. Processing Time**
Refunds processed directly through Google Play generally follow Google's standard processing times. Refund requests sent directly to us are answered promptly and, when eligible, forwarded as soon as possible to be processed.

**6. Contact Us**
If you have questions about this Refund Policy or want to start a refund request, please contact us at {{SUPPORT_EMAIL}}.

## 5. Account deletion page (final)

Onay: kabul (Opus, 2026-09-30, kullanıcı yetkisiyle)

**Delete your account**

You can delete your Zikirmatik Asistan account and the data linked to it at any time. Deletion is permanent and cannot be undone.

**Option 1: Delete it inside the app**
1. Open the app and go to Profile. 2. Tap "Delete account". 3. Confirm when asked. Your account and the data listed below are deleted immediately.

**Option 2: Request deletion by email**
Send an email to {email} with the subject "Account deletion" from the email address you use to sign in (Google or Apple), so that we can verify it is your account. We process such requests within 30 days.

**What is deleted**
Your account and sign-in identity; your custom dhikrs and collections; your dhikr logs, streaks and statistics; your wird programs and progress; your AI Guide recommendations, chat conversations and credit balance; subscription records held by us; your registered devices and notification tokens; your membership in dhikr circles. Note: a circle's shared total is not linked to any one person and remains visible to the other members after you are removed from it.

**What is retained**
Purchase and billing records are held by Google Play under Google's own policies; we do not control them. Anonymized technical logs and crash diagnostics that cannot identify you may be kept for a limited time. Data we are legally required to keep is retained only for as long as the law requires.

**Subscriptions**
Deleting your account does not cancel an active Google Play subscription. Cancel it first from the "Subscriptions" section of the Google Play app to avoid further charges.

**Data on your device**
Counts and settings stored only on your device are removed when you uninstall the app.

Türkçe karşılığı tr.json'a yazıldı.

## 6. Gözlemler (taslağı etkileyen, karar gerektiren)

- Gizlilik §2 ve Şartlar §4 yalnız Google Play satın alımlarından söz ediyor; iOS için Apple ödemesi metinde yok. Türkçede olmayan bir iddia eklenmedi. Karar: yalnız Play yayını; Apple ödemesi kapsam dışı, metin TR ile aynı kaldı.
- TR Gizlilik §2 senkronizasyonu yalnız "Google ile giriş yaptığınızda" diyor, §3 ise Apple'ı da kapsıyor. Aynen çevrildi. Karar: TR ile aynı bırakıldı.
