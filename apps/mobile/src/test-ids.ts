// Detox e2e seçicileri (apps/mobile/e2e). Değerler e2e/helpers.js'te de
// düz string olarak kullanılır — değiştirirsen ikisini birlikte güncelle.
export const TEST_IDS = {
  auth: {
    google: "e2e-auth-google",
    guest: "e2e-auth-guest",
    close: "e2e-auth-close",
    // Misafir Kaydet → "Kalıcı kaydetmek için giriş yap" istemi (auth-prompt-modal.tsx).
    promptConfirm: "e2e-auth-prompt-confirm",
    promptCancel: "e2e-auth-prompt-cancel",
  },
  tabs: {
    home: "e2e-tab-home",
    focus: "e2e-tab-focus",
    aiGuide: "e2e-tab-ai-guide",
    specialDays: "e2e-tab-special-days",
    // Sekme çubuğundaki "Daha fazla" düğmesi; stats/collections/profile menüden açılır.
    more: "e2e-tab-more",
    stats: "e2e-tab-stats",
    collections: "e2e-tab-collections",
    profile: "e2e-tab-profile",
  },
  notifications: {
    // "Günlük hatırlatma ister misin?" kartı (notification-permission-modal.tsx).
    offerConfirm: "e2e-notif-offer-confirm",
    offerDismiss: "e2e-notif-offer-dismiss"
  },
  tour: { skip: "e2e-tour-skip", next: "e2e-tour-next" },
  home: {
    scroll: "e2e-home-scroll",
    counter: "e2e-home-counter",
    countLabel: "e2e-home-count-label",
    save: "e2e-home-save",
    reset: "e2e-home-reset",
    streak: "e2e-home-streak",
    // Tur sonrası açılan "Hoş geldin" Esma sayfası → "Sonra bak".
    welcomeLater: "e2e-home-welcome-later",
    // Serbest modda kaydet → ad isteyen sayfa.
    saveNameInput: "e2e-home-save-name-input",
    saveTargetInput: "e2e-home-save-target-input",
    saveNameSubmit: "e2e-home-save-name-submit",
    // Kaydet/geçiş hataları ve bildirimler (B-1): ana sayfa toast'ı.
    toast: "e2e-home-toast",
    // Sıfırla onay modalı (SAY-15/16).
    resetConfirm: "e2e-home-reset-confirm",
    resetCancel: "e2e-home-reset-cancel",
    // Kaydedilmemiş zikir geçiş modalı (KAY-11/15/17).
    unsavedSaveContinue: "e2e-home-unsaved-save-continue",
    unsavedDiscard: "e2e-home-unsaved-discard",
    unsavedCancel: "e2e-home-unsaved-cancel",
    // Devam/sıfırdan modalı (KAY-19/20/21, M-06).
    resumeContinue: "e2e-home-resume-continue",
    resumeFresh: "e2e-home-resume-fresh",
    // Gün dönümü "dünkü N'i kaydet / at" (M-01).
    dayRolloverSave: "e2e-home-day-rollover-save",
    dayRolloverDiscard: "e2e-home-day-rollover-discard",
    // Serbest mod düğmesi, Esma tablosu hücreleri (`${esmaItem}-${sıra 1..99}`) ve "Hoş geldin" modalındaki "Başla" düğmeleri.
    freeMode: "e2e-home-free-mode",
    esmaItem: "e2e-home-esma-item",
    welcomeStart: "e2e-home-welcome-start",
    // Sayaç yan düğmeleri, hedef modalı ve "her yere dokun" anahtarı (Detox 15-*).
    targetButton: "e2e-home-target-button",
    targetInput: "e2e-home-target-input",
    targetSubmit: "e2e-home-target-submit",
    targetDowngradeApply: "e2e-home-target-downgrade-apply",
    targetDowngradeCancel: "e2e-home-target-downgrade-cancel",
    tapAnywhere: "e2e-home-tap-anywhere",
    lapCustomOption: "e2e-home-lap-custom-option",
    lapCustomInput: "e2e-home-lap-custom-input",
  },
  profile: {
    name: "e2e-profile-name",
    signIn: "e2e-profile-sign-in",
    scroll: "e2e-profile-scroll",
    logout: "e2e-profile-logout",
    deleteAccount: "e2e-profile-delete-account",
    deleteConfirm: "e2e-profile-delete-confirm",
    deleteError: "e2e-profile-delete-error",
    language: "e2e-profile-language",
    logoutConfirm: "e2e-profile-logout-confirm",
    premiumFeatures: "e2e-profile-premium-features",
  },
  collections: {
    card: "e2e-collection-card",
    filterChip: "e2e-collection-filter-chip",
    addToCounter: "e2e-collection-add-to-counter",
    detailScroll: "e2e-collection-detail-scroll",
    // Kategori sayfası başına bir FlatList (screen.tsx, PagerView): `${scroll}-${categoryKey}`
    // (ör. e2e-collection-scroll-gunluk) — testID'siz FlatList'e scroll() güvenilir değil.
    scroll: "e2e-collection-scroll",
  },
  theme: { swatch: "e2e-theme-swatch", scroll: "e2e-theme-scroll" },
  vird: {
    hub: "e2e-vird-hub",
    // apps/mobile/e2e/recordings/story-vird.e2e.js için eklendi (bkz. rapor):
    // hub'daki "şablonlardan seç" satırı, template-shelf.tsx'in kart Pressable'ı
    // (id `${templateCard}-${item.key}`, ör. e2e-vird-template-card-klasik-sabah)
    // ve template-detail-screen.tsx'in "Programı başlat" düğmesi hiçbirinin
    // testID'si yoktu — additive only, davranış değişmedi.
    templatesEntry: "e2e-vird-templates-entry",
    templateCard: "e2e-vird-template-card",
    // MOB-VRD-25: isPremium şablon kartındaki "Premium" rozeti (`${templateBadge}-${key}`) - Detox TODO
    templateBadge: "e2e-vird-template-badge",
    templateStart: "e2e-vird-template-start",
    reminderSettings: "e2e-vird-reminder-settings",
    newManual: "e2e-vird-new-manual",
    emptyCta: "e2e-vird-empty-cta",
    editorScroll: "e2e-vird-editor-scroll",
    editorTitle: "e2e-vird-editor-title",
    saveAndStart: "e2e-vird-save-and-start",
    session: "e2e-vird-session",
    sessionNext: "e2e-vird-session-next",
    sessionClose: "e2e-vird-session-close",
    todayCard: "e2e-vird-today-card",
    // Dilim satırı: `${todayStart}-${slot}` (ör. e2e-vird-today-start-morning).
    todayStart: "e2e-vird-today-start",
    todayDone: "e2e-vird-today-done",
    // Editör: `${slotAdd}-${slot}`; picker satırları ve hedef inputları aynı id'yi paylaşır (atIndex).
    slotAdd: "e2e-vird-slot-add",
    itemTarget: "e2e-vird-item-target",
    pickerRow: "e2e-vird-picker-row",
    pickerDone: "e2e-vird-picker-done",
    // vird-dhikr-picker-modal.tsx'in arama alanı testID'siz idi — story-circle.e2e.js'in
    // ilk satır yerine evrensel bir zikir (Sübhanallah/Salavat) seçebilmesi için eklendi.
    pickerSearch: "e2e-vird-picker-search",
    sessionCounter: "e2e-vird-session-counter",
    sessionCountLabel: "e2e-vird-session-count-label",
    sessionFinish: "e2e-vird-session-finish",
    // "Atla" bağlantısı (hedefe ulaşmadan sıradaki zikre geç) testID'siz —
    // story-vird.e2e.js'in tüm gerçek dataset'i (klasik-sabah ~20 zikir, biri 100
    // hedefli) tek tek saymadan "gün tamamlandı" durumuna ulaşması için eklendi.
    sessionSkip: "e2e-vird-session-skip",
    // "Diğer programlar" satırı: duraklat/aktifleştir düğmesi ve süresi dolmuş programda
    // "Kopyala ve yeniden başlat" (M-22, A-23 Detox TODO).
    programToggle: "e2e-vird-program-toggle",
    programCloneRestart: "e2e-vird-program-clone-restart",
    // Çakışma modalı "Duraklat ve başlat" düğmesi.
    swapPauseAndStart: "e2e-vird-swap-pause-and-start",
    swapKeepDraft: "e2e-vird-swap-keep-draft",
    // AI ile vird oluşturma: serbest metin, oluştur, önizlemede başlat / vazgeç.
    aiFreeText: "e2e-vird-ai-free-text",
    aiSubmit: "e2e-vird-ai-submit",
    aiStart: "e2e-vird-ai-start",
    aiDiscard: "e2e-vird-ai-discard",
    // Şablon rafı yükleme hatasında "Tekrar dene" (MOB-VRD-28).
    templatesRetry: "e2e-vird-templates-retry",
  },
  circle: {
    hub: "e2e-circle-hub",
    notFound: "e2e-circle-not-found",
    actionError: "e2e-circle-action-error",
    newCircle: "e2e-circle-new",
    codeInput: "e2e-circle-code-input",
    joinButton: "e2e-circle-join",
    homeCard: "e2e-circle-home-card",
    homeCardActive: "e2e-circle-home-card-active",
    homeCardHub: "e2e-circle-home-card-hub",
    pickDhikr: "e2e-circle-pick-dhikr",
    goalInput: "e2e-circle-goal-input",
    submit: "e2e-circle-submit",
    code: "e2e-circle-code",
    // apps/mobile/e2e/recordings/story-circle.e2e.js için eklendi (bkz. rapor):
    // circle-session-screen.tsx AppleWatchView/TesbihCounterView'a testIDs prop'u
    // hiç geçmiyordu (bileşen destekliyor ama opsiyonel) — additive only.
    sessionCounter: "e2e-circle-session-counter",
    sessionCountLabel: "e2e-circle-session-count-label",
    // circle-detail-screen.tsx'in "Başlat" düğmesi ve circle-session-screen.tsx'in
    // kapatma ikonu testID'siz idi — story-circle.e2e.js için eklendi (bkz. rapor).
    sessionStart: "e2e-circle-session-start",
    sessionClose: "e2e-circle-session-close",
    // Oturum modeli: elle gönder / toplamı yenile / bekleyen göstergesi / hata satırı / dua metni.
    sessionScroll: "e2e-circle-session-scroll",
    sendButton: "e2e-circle-send",
    refreshButton: "e2e-circle-refresh",
    pendingCount: "e2e-circle-pending-count",
    sessionNotice: "e2e-circle-session-notice",
    dhikrText: "e2e-circle-dhikr-text",
    // Hedefe ulaşınca / kapatılınca sayaç yerine görünen kilit kartı (M-11, MOB-HAL-24/25).
    sessionLocked: "e2e-circle-session-locked",
    // Katılma önizlemesindeki "Katıl" düğmesi; detaydaki ayrıl/kapat düğmeleri ve onay butonları.
    joinCta: "e2e-circle-join-cta",
    leave: "e2e-circle-leave",
    leaveConfirm: "e2e-circle-leave-confirm",
    close: "e2e-circle-close",
    closeConfirm: "e2e-circle-close-confirm",
  },
  // Rozet kutlama modalı (kayıt/seri başarılarında açılır, diğer modalları bekletir).
  stats: { badgeClose: "e2e-stats-badge-close" },
  premium: { sheet: "e2e-premium-sheet", scroll: "e2e-premium-scroll", close: "e2e-premium-close" },
  aiGuide: {
    scroll: "e2e-ai-guide-scroll",
    input: "e2e-ai-guide-input",
    send: "e2e-ai-guide-send",
    sendDisabled: "e2e-ai-guide-send-disabled",
    recommendation: "e2e-ai-guide-recommendation",
    // Sonuç alanındaki hata/konu dışı/netleştirme blokları.
    unavailable: "e2e-ai-guide-unavailable",
    offTopic: "e2e-ai-guide-off-topic",
    clarify: "e2e-ai-guide-clarify",
  },
  // Zikirlerim (focus) ekranı + ayarlar alt ekranları (Detox 15-*).
  zikirlerim: {
    add: "e2e-zikir-add",
    filter: "e2e-zikir-filter", // `${filter}-${all|active|completed|favorites}`
    formName: "e2e-zikir-form-name",
    formTarget: "e2e-zikir-form-target",
    formSubmit: "e2e-zikir-form-submit",
    formError: "e2e-zikir-form-error",
    menu: "e2e-zikir-menu",
    favorite: "e2e-zikir-favorite",
    update: "e2e-zikir-update",
    delete: "e2e-zikir-delete",
    deleteConfirm: "e2e-zikir-delete-confirm",
    deleteError: "e2e-zikir-delete-error",
    start: "e2e-zikir-start",
  },
  settings: {
    theme: "e2e-settings-theme",
    font: "e2e-settings-font",
    tourReplay: "e2e-settings-tour-replay",
    themeSwatchLocked: "e2e-theme-swatch-locked",
    themeSave: "e2e-theme-save",
    fontOption: "e2e-font-option", // `${fontOption}-${id}`
    fontSave: "e2e-font-save",
    fontScroll: "e2e-font-scroll",
  },
  aiChat: {
    entry: "e2e-ai-chat-entry",
    input: "e2e-ai-chat-input",
    send: "e2e-ai-chat-send",
    credits: "e2e-ai-chat-credits",
    assistantMessage: "e2e-ai-chat-assistant-message",
  },
} as const;
