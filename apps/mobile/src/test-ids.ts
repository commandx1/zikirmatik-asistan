// Detox e2e seçicileri (apps/mobile/e2e). Değerler e2e/helpers.js'te de
// düz string olarak kullanılır — değiştirirsen ikisini birlikte güncelle.
export const TEST_IDS = {
  auth: { google: "e2e-auth-google", guest: "e2e-auth-guest", close: "e2e-auth-close" },
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
  },
  profile: { name: "e2e-profile-name" },
  vird: {
    hub: "e2e-vird-hub",
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
    sessionCounter: "e2e-vird-session-counter",
    sessionFinish: "e2e-vird-session-finish",
  },
  circle: {
    hub: "e2e-circle-hub",
    newCircle: "e2e-circle-new",
    codeInput: "e2e-circle-code-input",
    joinButton: "e2e-circle-join",
    homeCard: "e2e-circle-home-card",
    pickDhikr: "e2e-circle-pick-dhikr",
    goalInput: "e2e-circle-goal-input",
    submit: "e2e-circle-submit",
    code: "e2e-circle-code",
  },
  premium: { sheet: "e2e-premium-sheet", scroll: "e2e-premium-scroll", close: "e2e-premium-close" },
  aiGuide: {
    scroll: "e2e-ai-guide-scroll",
    input: "e2e-ai-guide-input",
    send: "e2e-ai-guide-send",
    recommendation: "e2e-ai-guide-recommendation",
  },
  aiChat: {
    entry: "e2e-ai-chat-entry",
    input: "e2e-ai-chat-input",
    send: "e2e-ai-chat-send",
    credits: "e2e-ai-chat-credits",
    assistantMessage: "e2e-ai-chat-assistant-message",
  },
} as const;
