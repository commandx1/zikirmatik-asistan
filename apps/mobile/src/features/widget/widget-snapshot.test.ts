import { describe, expect, it } from "vitest";
import { buildWidgetSnapshot, formatWidgetCount, type WidgetRawInput } from "./widget-snapshot";

const EMPTY_RAW: WidgetRawInput = {
  dhikrStore: null,
  virdStore: null,
  circleStore: null,
  profileStore: null,
  themeStore: null,
  widgetState: null
};

function dhikrStore(items: unknown[], extra: Record<string, unknown> = {}) {
  return JSON.stringify({ state: { items, freeModeCount: 0, ...extra }, version: 2 });
}

function virdStore(dayProgress: Record<string, unknown>) {
  return JSON.stringify({ state: { dayProgress }, version: 1 });
}

function circleStore(todayCounts: unknown) {
  return JSON.stringify({ state: { todayCounts }, version: 1 });
}

function profileStore(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({ state: { locale: "tr", isPremium: false, ...overrides }, version: 1 });
}

function virdProgram(overrides: Record<string, unknown> = {}) {
  return {
    id: "p1",
    clientId: "p1",
    origin: "local",
    kind: "routine",
    status: "active",
    source: "manual",
    title: { tr: "Test Vird", en: "Test Vird" },
    startDate: "2026-09-21",
    phases: [{ fromDay: 1, toDay: null, slots: { morning: [{ dhikrId: "d1", target: 10 }] } }],
    prayerSelection: [1, 2, 3, 4, 5],
    dhikrs: { d1: { ref: "d1", isCustom: false, name: { tr: "Sübhanallah", en: "SubhanAllah" } } },
    createdAt: "2026-09-21T00:00:00.000Z",
    updatedAt: "2026-09-21T00:00:00.000Z",
    ...overrides
  };
}

function virdStoreFull(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    state: {
      programs: [],
      activeProgramId: null,
      dayProgress: {},
      reminderPrefs: {
        enabled: false,
        slots: { morning: false, prayer: false, evening: false, night: false },
        coords: null
      },
      lastServerSyncAt: null,
      ...overrides
    },
    version: 1
  });
}

describe("buildWidgetSnapshot", () => {
  it("counts only today's items across a day rollover", () => {
    const now = new Date(2026, 8, 21, 10, 0, 0);
    const raw: WidgetRawInput = {
      ...EMPTY_RAW,
      dhikrStore: dhikrStore([
        { current: 30, target: 33, lastActivityAt: new Date(2026, 8, 20, 22, 0, 0).toISOString() },
        { current: 15, target: 33, lastActivityAt: new Date(2026, 8, 21, 9, 0, 0).toISOString() }
      ])
    };

    const snapshot = buildWidgetSnapshot(raw, now);
    expect(snapshot.todayTotal).toBe(15);
  });

  it("returns zeros and defaults for all-null input without throwing", () => {
    const snapshot = buildWidgetSnapshot(EMPTY_RAW, new Date(2026, 8, 21));
    expect(snapshot.todayTotal).toBe(0);
    expect(snapshot.streak).toBe(0);
    expect(snapshot.locale).toBe("tr");
    expect(snapshot.colors).toEqual({
      bg: "#0B1423",
      card: "#162236",
      text: "#F4F6FB",
      muted: "#98A8C2",
      accent: "#C8972A"
    });
  });

  it("does not throw on malformed JSON", () => {
    const raw: WidgetRawInput = { ...EMPTY_RAW, dhikrStore: "{not json", profileStore: "]]]" };
    expect(() => buildWidgetSnapshot(raw, new Date(2026, 8, 21))).not.toThrow();
  });

  it("uses serverStreak when fetchedOn is today (no lastActiveDate: legacy compat)", () => {
    const now = new Date(2026, 8, 21);
    const raw: WidgetRawInput = {
      ...EMPTY_RAW,
      widgetState: JSON.stringify({
        state: { serverStreak: { value: 12, fetchedOn: "2026-09-21" } },
        version: 1
      })
    };

    expect(buildWidgetSnapshot(raw, now).streak).toBe(12);
  });

  it("falls back to local streak when serverStreak is stale", () => {
    const now = new Date(2026, 8, 21);
    const raw: WidgetRawInput = {
      ...EMPTY_RAW,
      widgetState: JSON.stringify({
        state: { serverStreak: { value: 12, fetchedOn: "2026-09-18" } },
        version: 1
      }),
      dhikrStore: dhikrStore([
        { current: 33, target: 33, lastActivityAt: new Date(2026, 8, 21, 9, 0, 0).toISOString() },
        { current: 33, target: 33, lastActivityAt: new Date(2026, 8, 20, 9, 0, 0).toISOString() }
      ])
    };

    expect(buildWidgetSnapshot(raw, now).streak).toBe(2);
  });

  it("reads locale 'en' from profile store", () => {
    const raw: WidgetRawInput = {
      ...EMPTY_RAW,
      profileStore: JSON.stringify({ state: { locale: "en" }, version: 1 })
    };

    expect(buildWidgetSnapshot(raw, new Date(2026, 8, 21)).locale).toBe("en");
  });

  it("adds vird dayProgress for today across multiple itemKeys, ignores yesterday", () => {
    const now = new Date(2026, 8, 21, 10, 0, 0);
    const raw: WidgetRawInput = {
      ...EMPTY_RAW,
      virdStore: virdStore({
        "2026-09-21": { morning: { count: 100 }, evening: { count: 33 } },
        "2026-09-20": { morning: { count: 500 } }
      })
    };

    expect(buildWidgetSnapshot(raw, now).todayTotal).toBe(133);
  });

  it("adds circle todayCounts only for entries dated today", () => {
    const now = new Date(2026, 8, 21, 10, 0, 0);
    const raw: WidgetRawInput = {
      ...EMPTY_RAW,
      circleStore: circleStore({
        circleA: { dateKey: "2026-09-21", count: 50 },
        circleB: { dateKey: "2026-09-20", count: 900 }
      })
    };

    expect(buildWidgetSnapshot(raw, now).todayTotal).toBe(50);
  });

  it("vird ve ana sayaç ayrı sayımlardır, max ALINMAZ: aynı zikirin ana sayaç current'ı + vird dayProgress'i toplanır", () => {
    const now = new Date(2026, 8, 21, 10, 0, 0);
    const raw: WidgetRawInput = {
      ...EMPTY_RAW,
      dhikrStore: dhikrStore([{ current: 100, target: 100, lastActivityAt: now.toISOString() }]),
      virdStore: virdStore({ "2026-09-21": { fajr: { count: 100 } } })
    };

    expect(buildWidgetSnapshot(raw, now).todayTotal).toBe(200);
  });

  it("freeModeActivityAt dün ise bugüne eklenmez", () => {
    const now = new Date(2026, 8, 21, 0, 5, 0);
    const raw: WidgetRawInput = {
      ...EMPTY_RAW,
      dhikrStore: dhikrStore([], {
        freeModeCount: 40,
        freeModeActivityAt: new Date(2026, 8, 20, 23, 0, 0).toISOString()
      })
    };

    expect(buildWidgetSnapshot(raw, now).todayTotal).toBe(0);
  });

  it("freeModeActivityAt bugün ise eklenir", () => {
    const now = new Date(2026, 8, 21, 10, 0, 0);
    const raw: WidgetRawInput = {
      ...EMPTY_RAW,
      dhikrStore: dhikrStore([], {
        freeModeCount: 40,
        freeModeActivityAt: new Date(2026, 8, 21, 9, 0, 0).toISOString()
      })
    };

    expect(buildWidgetSnapshot(raw, now).todayTotal).toBe(40);
  });

  it("freeModeActivityAt alanı hiç yoksa (eski persist) bugüne eklenir", () => {
    const now = new Date(2026, 8, 21, 10, 0, 0);
    const raw: WidgetRawInput = {
      ...EMPTY_RAW,
      dhikrStore: dhikrStore([], { freeModeCount: 40 })
    };

    expect(buildWidgetSnapshot(raw, now).todayTotal).toBe(40);
  });

  it("does not throw when circleStore is null, malformed JSON, or todayCounts is an array", () => {
    const now = new Date(2026, 8, 21);
    expect(() => buildWidgetSnapshot({ ...EMPTY_RAW, circleStore: null }, now)).not.toThrow();
    expect(() => buildWidgetSnapshot({ ...EMPTY_RAW, circleStore: "{bozuk" }, now)).not.toThrow();

    const arrayRaw: WidgetRawInput = { ...EMPTY_RAW, circleStore: circleStore([{ dateKey: "2026-09-21", count: 5 }]) };
    expect(buildWidgetSnapshot(arrayRaw, now).todayTotal).toBe(0);
  });

  it("gün dönüşü: now=00:05, dünkü her şey (ana sayaç + vird + halka + serbest mod) 0 sayılır", () => {
    const now = new Date(2026, 8, 21, 0, 5, 0);
    const yesterdayIso = new Date(2026, 8, 20, 22, 0, 0).toISOString();
    const raw: WidgetRawInput = {
      ...EMPTY_RAW,
      dhikrStore: dhikrStore([{ current: 33, target: 33, lastActivityAt: yesterdayIso }], {
        freeModeCount: 10,
        freeModeActivityAt: yesterdayIso
      }),
      virdStore: virdStore({ "2026-09-20": { fajr: { count: 100 } } }),
      circleStore: circleStore({ circleA: { dateKey: "2026-09-20", count: 900 } })
    };

    expect(buildWidgetSnapshot(raw, now).todayTotal).toBe(0);
  });

  describe("streak with lastActiveDate", () => {
    const now = new Date(2026, 8, 21);

    it("lastActiveDate bugün -> value", () => {
      const raw: WidgetRawInput = {
        ...EMPTY_RAW,
        widgetState: JSON.stringify({
          state: { serverStreak: { value: 7, fetchedOn: "2026-09-21", lastActiveDate: "2026-09-21" } },
          version: 1
        })
      };
      expect(buildWidgetSnapshot(raw, now).streak).toBe(7);
    });

    it("lastActiveDate dün -> value", () => {
      const raw: WidgetRawInput = {
        ...EMPTY_RAW,
        widgetState: JSON.stringify({
          state: { serverStreak: { value: 7, fetchedOn: "2026-09-21", lastActiveDate: "2026-09-20" } },
          version: 1
        })
      };
      expect(buildWidgetSnapshot(raw, now).streak).toBe(7);
    });

    it("lastActiveDate 2 gün önce -> yerel hesaba düşer (fetchedOn bugün olsa bile)", () => {
      const raw: WidgetRawInput = {
        ...EMPTY_RAW,
        widgetState: JSON.stringify({
          state: { serverStreak: { value: 7, fetchedOn: "2026-09-21", lastActiveDate: "2026-09-19" } },
          version: 1
        }),
        dhikrStore: dhikrStore([{ current: 33, target: 33, lastActivityAt: new Date(2026, 8, 21, 9, 0, 0).toISOString() }])
      };
      expect(buildWidgetSnapshot(raw, now).streak).toBe(1);
    });

    it("lastActiveDate yok + fetchedOn dün -> value (geri uyum)", () => {
      const raw: WidgetRawInput = {
        ...EMPTY_RAW,
        widgetState: JSON.stringify({
          state: { serverStreak: { value: 9, fetchedOn: "2026-09-20" } },
          version: 1
        })
      };
      expect(buildWidgetSnapshot(raw, now).streak).toBe(9);
    });

    function widgetState(value: number, lastActiveDate: string, fetchedOn = "2026-09-21") {
      return JSON.stringify({ state: { serverStreak: { value, fetchedOn, lastActiveDate } }, version: 1 });
    }

    it("a) lastActiveDate 2 gün önce + yerelde DÜN tamamlanmış ana sayaç öğesi -> zincir uzar (13)", () => {
      const raw: WidgetRawInput = {
        ...EMPTY_RAW,
        widgetState: widgetState(12, "2026-09-19"),
        dhikrStore: dhikrStore([{ current: 10, target: 10, lastActivityAt: new Date(2026, 8, 20, 9, 0, 0).toISOString() }])
      };
      expect(buildWidgetSnapshot(raw, now).streak).toBe(13);
    });

    it("b) lastActiveDate 2 gün önce + yerelde DÜN tamamlanmış vird kanıtı -> zincir uzar (13)", () => {
      const raw: WidgetRawInput = {
        ...EMPTY_RAW,
        widgetState: widgetState(12, "2026-09-19"),
        virdStore: virdStore({ "2026-09-20": { "morning:0:d1": { count: 10, target: 10, completed: true } } })
      };
      expect(buildWidgetSnapshot(raw, now).streak).toBe(13);
    });

    it("c) lastActiveDate 2 gün önce + yerelde dün kanıt yok -> yerel hesaba düşer (12 dönmez)", () => {
      const raw: WidgetRawInput = {
        ...EMPTY_RAW,
        widgetState: widgetState(12, "2026-09-19")
      };
      const streak = buildWidgetSnapshot(raw, now).streak;
      expect(streak).not.toBe(12);
      expect(streak).toBe(0);
    });

    it("d) lastActiveDate dün + yerelde BUGÜN tamamlanma -> zincir uzar (13)", () => {
      const raw: WidgetRawInput = {
        ...EMPTY_RAW,
        widgetState: widgetState(12, "2026-09-20"),
        dhikrStore: dhikrStore([{ current: 10, target: 10, lastActivityAt: new Date(2026, 8, 21, 9, 0, 0).toISOString() }])
      };
      expect(buildWidgetSnapshot(raw, now).streak).toBe(13);
    });

    it("e) lastActiveDate bugün + yerelde bugün tamamlanma -> çift sayım yok (12)", () => {
      const raw: WidgetRawInput = {
        ...EMPTY_RAW,
        widgetState: widgetState(12, "2026-09-21"),
        dhikrStore: dhikrStore([{ current: 10, target: 10, lastActivityAt: new Date(2026, 8, 21, 9, 0, 0).toISOString() }])
      };
      expect(buildWidgetSnapshot(raw, now).streak).toBe(12);
    });

    it("f) lastActiveDate 3 gün önce + yerelde 2 gün önce+dün+bugün tamam -> 15", () => {
      const raw: WidgetRawInput = {
        ...EMPTY_RAW,
        widgetState: widgetState(12, "2026-09-18"),
        dhikrStore: dhikrStore([
          { current: 10, target: 10, lastActivityAt: new Date(2026, 8, 19, 9, 0, 0).toISOString() },
          { current: 10, target: 10, lastActivityAt: new Date(2026, 8, 20, 9, 0, 0).toISOString() },
          { current: 10, target: 10, lastActivityAt: new Date(2026, 8, 21, 9, 0, 0).toISOString() }
        ])
      };
      expect(buildWidgetSnapshot(raw, now).streak).toBe(15);
    });

    it("g) lastActiveDate 3 gün önce + yerelde yalnız dün tamam (2 gün önce boş) -> zincir kopuk, yerel hesap (1)", () => {
      const raw: WidgetRawInput = {
        ...EMPTY_RAW,
        widgetState: widgetState(12, "2026-09-18"),
        dhikrStore: dhikrStore([
          { current: 10, target: 10, lastActivityAt: new Date(2026, 8, 20, 9, 0, 0).toISOString() }
        ])
      };
      expect(buildWidgetSnapshot(raw, now).streak).toBe(1);
    });

    it("h) lastActiveDate gelecekte -> önbellek yok sayılır, yerel hesap kullanılır", () => {
      const raw: WidgetRawInput = {
        ...EMPTY_RAW,
        widgetState: widgetState(99, "2026-09-22"),
        dhikrStore: dhikrStore([{ current: 10, target: 10, lastActivityAt: new Date(2026, 8, 21, 9, 0, 0).toISOString() }])
      };
      expect(buildWidgetSnapshot(raw, now).streak).toBe(1);
    });

    it("i) lastActiveDate bozuk string ('abc') -> throw yok, yerel hesaba düşer", () => {
      const raw: WidgetRawInput = {
        ...EMPTY_RAW,
        widgetState: widgetState(5, "abc")
      };
      expect(() => buildWidgetSnapshot(raw, now)).not.toThrow();
      expect(buildWidgetSnapshot(raw, now).streak).toBe(0);
    });

    it("j) vird dayProgress bozuk şekiller -> throw yok", () => {
      const now2 = new Date(2026, 8, 21);
      const malformedShapes: unknown[] = [
        ["not", "an", "object"],
        null,
        { "2026-09-20": null },
        { "2026-09-20": ["array-not-object"] },
        { "2026-09-20": { itemA: "completed-as-string" } },
        { "abc": { itemA: { completed: true } } }
      ];
      for (const dayProgress of malformedShapes) {
        const raw: WidgetRawInput = {
          ...EMPTY_RAW,
          widgetState: widgetState(12, "2026-09-19"),
          virdStore: JSON.stringify({ state: { dayProgress }, version: 1 })
        };
        expect(() => buildWidgetSnapshot(raw, now2)).not.toThrow();
      }
    });

    it("k) completed:false olan vird öğesi günü saymaz", () => {
      const raw: WidgetRawInput = {
        ...EMPTY_RAW,
        widgetState: widgetState(12, "2026-09-19"),
        virdStore: virdStore({ "2026-09-20": { "morning:0:d1": { count: 5, target: 10, completed: false } } })
      };
      expect(buildWidgetSnapshot(raw, now).streak).not.toBe(13);
    });
  });

  describe("vird", () => {
    it("locked when isPremium false or missing", () => {
      const now = new Date(2026, 8, 21, 10, 0, 0);
      expect(
        buildWidgetSnapshot({ ...EMPTY_RAW, profileStore: profileStore({ isPremium: false }) }, now).vird
      ).toEqual({ kind: "locked" });
      expect(buildWidgetSnapshot({ ...EMPTY_RAW, profileStore: null }, now).vird).toEqual({ kind: "locked" });
    });

    it("noProgram when premium but no active program", () => {
      const now = new Date(2026, 8, 21, 10, 0, 0);
      const raw: WidgetRawInput = { ...EMPTY_RAW, profileStore: profileStore({ isPremium: true }) };
      expect(buildWidgetSnapshot(raw, now).vird).toEqual({ kind: "noProgram" });
    });

    it("noProgram when premium but virdStore is malformed", () => {
      const now = new Date(2026, 8, 21, 10, 0, 0);
      const raw: WidgetRawInput = {
        ...EMPTY_RAW,
        profileStore: profileStore({ isPremium: true }),
        virdStore: "{not json"
      };
      expect(buildWidgetSnapshot(raw, now).vird).toEqual({ kind: "noProgram" });
    });

    it("done when today's expected items are all complete", () => {
      const now = new Date(2026, 8, 21, 10, 0, 0);
      const program = virdProgram();
      const raw: WidgetRawInput = {
        ...EMPTY_RAW,
        profileStore: profileStore({ isPremium: true }),
        virdStore: virdStoreFull({
          programs: [program],
          activeProgramId: program.id,
          dayProgress: { "2026-09-21": { "morning:0:d1": { count: 10, target: 10, completed: true } } }
        })
      };
      const vird = buildWidgetSnapshot(raw, now).vird;
      expect(vird.kind).toBe("done");
    });

    it("active state exposes uri with encoded programId/slot and the first incomplete item", () => {
      const now = new Date(2026, 8, 21, 10, 0, 0);
      const program = virdProgram({ id: "p 1", clientId: "p 1" });
      const raw: WidgetRawInput = {
        ...EMPTY_RAW,
        profileStore: profileStore({ isPremium: true }),
        virdStore: virdStoreFull({ programs: [program], activeProgramId: program.id, dayProgress: {} })
      };
      const vird = buildWidgetSnapshot(raw, now).vird;
      expect(vird.kind).toBe("active");
      if (vird.kind === "active") {
        expect(vird.slot).toBe("morning");
        expect(vird.done).toBe(0);
        expect(vird.total).toBe(1);
        expect(vird.nextName).toBe("Sübhanallah");
        expect(vird.nextCount).toBe(0);
        expect(vird.nextTarget).toBe(10);
        expect(vird.uri).toContain("programId=p%201");
        expect(vird.uri).toContain("slot=morning");
      }
    });

    it("prayer slice includes prayerIndex in the uri", () => {
      const now = new Date(2026, 8, 21, 14, 0, 0);
      const program = virdProgram({
        phases: [{ fromDay: 1, toDay: null, slots: { prayer: [{ dhikrId: "d1", target: 5 }] } }],
        prayerSelection: [2]
      });
      const raw: WidgetRawInput = {
        ...EMPTY_RAW,
        profileStore: profileStore({ isPremium: true }),
        virdStore: virdStoreFull({ programs: [program], activeProgramId: program.id, dayProgress: {} })
      };
      const vird = buildWidgetSnapshot(raw, now).vird;
      expect(vird.kind).toBe("active");
      if (vird.kind === "active") {
        expect(vird.slot).toBe("prayer");
        expect(vird.uri).toContain("prayerIndex=2");
      }
    });

    it("resolveNowSlot dilimi bitmişse ilk eksik dilime düşer", () => {
      const now = new Date(2026, 8, 21, 10, 0, 0);
      const program = virdProgram({
        phases: [
          {
            fromDay: 1,
            toDay: null,
            slots: {
              morning: [{ dhikrId: "d1", target: 10 }],
              evening: [{ dhikrId: "d1", target: 5 }]
            }
          }
        ]
      });
      const raw: WidgetRawInput = {
        ...EMPTY_RAW,
        profileStore: profileStore({ isPremium: true }),
        virdStore: virdStoreFull({
          programs: [program],
          activeProgramId: program.id,
          dayProgress: { "2026-09-21": { "morning:0:d1": { count: 10, target: 10, completed: true } } }
        })
      };
      const vird = buildWidgetSnapshot(raw, now).vird;
      expect(vird.kind).toBe("active");
      if (vird.kind === "active") {
        expect(vird.slot).toBe("evening");
      }
    });

    it("gün dönüşü: dünkü dayProgress bugünü tamamlamaz", () => {
      const now = new Date(2026, 8, 21, 10, 0, 0);
      const program = virdProgram();
      const raw: WidgetRawInput = {
        ...EMPTY_RAW,
        profileStore: profileStore({ isPremium: true }),
        virdStore: virdStoreFull({
          programs: [program],
          activeProgramId: program.id,
          dayProgress: { "2026-09-20": { "morning:0:d1": { count: 10, target: 10, completed: true } } }
        })
      };
      const vird = buildWidgetSnapshot(raw, now).vird;
      expect(vird.kind).toBe("active");
      if (vird.kind === "active") {
        expect(vird.done).toBe(0);
      }
    });

    it("noItemsToday when program starts tomorrow", () => {
      const now = new Date(2026, 8, 21, 10, 0, 0);
      const program = virdProgram({ startDate: "2026-09-22" });
      const raw: WidgetRawInput = {
        ...EMPTY_RAW,
        profileStore: profileStore({ isPremium: true }),
        virdStore: virdStoreFull({ programs: [program], activeProgramId: program.id, dayProgress: {} })
      };
      const vird = buildWidgetSnapshot(raw, now).vird;
      expect(vird.kind).toBe("noItemsToday");
    });

    it("noItemsToday when today's phase has no slot items", () => {
      const now = new Date(2026, 8, 21, 10, 0, 0);
      const program = virdProgram({ phases: [{ fromDay: 1, toDay: null, slots: {} }] });
      const raw: WidgetRawInput = {
        ...EMPTY_RAW,
        profileStore: profileStore({ isPremium: true }),
        virdStore: virdStoreFull({ programs: [program], activeProgramId: program.id, dayProgress: {} })
      };
      const vird = buildWidgetSnapshot(raw, now).vird;
      expect(vird.kind).toBe("noItemsToday");
      if (vird.kind === "noItemsToday") {
        expect(vird.streak).toBe(0);
      }
    });

    it("bitmiş journey noProgram döner", () => {
      const now = new Date(2026, 8, 21, 10, 0, 0);
      const program = virdProgram({
        kind: "journey",
        startDate: "2026-08-01",
        phases: [{ fromDay: 1, toDay: 5, slots: { morning: [{ dhikrId: "d1", target: 10 }] } }]
      });
      const raw: WidgetRawInput = {
        ...EMPTY_RAW,
        profileStore: profileStore({ isPremium: true }),
        virdStore: virdStoreFull({ programs: [program], activeProgramId: program.id, dayProgress: {} })
      };
      expect(buildWidgetSnapshot(raw, now).vird).toEqual({ kind: "noProgram" });
    });
  });

  describe("formatWidgetCount", () => {
    const cases: Array<[number, string, string]> = [
      [0, "0", "0"],
      [999, "999", "999"],
      [1234, "1.234", "1,234"],
      [9999, "9.999", "9,999"],
      [10000, "10 B", "10K"],
      [12345, "12,3 B", "12.3K"],
      [999949, "999,9 B", "999.9K"],
      [999950, "1 Mn", "1M"],
      [999999, "1 Mn", "1M"],
      [Infinity, "0", "0"],
      [1200000, "1,2 Mn", "1.2M"],
      [-5, "0", "0"],
      [NaN, "0", "0"]
    ];

    for (const [input, tr, en] of cases) {
      it(`formats ${input}`, () => {
        expect(formatWidgetCount(input, "tr")).toBe(tr);
        expect(formatWidgetCount(input, "en")).toBe(en);
      });
    }
  });
});
