import { describe, expect, it } from "vitest";
import { toBackendUserHydration } from "./backend-user-hydration";

describe("toBackendUserHydration", () => {
  it("kullanıcı belgesini profil + görünüm yüklerine eşler", () => {
    const { profile, appearance } = toBackendUserHydration({
      _id: "u1",
      displayName: "Ali",
      isPremium: true,
      theme: "gece-koyu",
      fontFamily: "merriweather",
      hapticsPattern: "hafif",
      notifSettings: { reminderTime: "07:30", dailyReminder: true, kandilNotifications: false }
    } as never);

    expect(profile).toMatchObject({
      displayName: "Ali",
      isPremium: true,
      reminderTime: "07:30",
      dailyReminderEnabled: true,
      kandilNotificationsEnabled: false,
      hapticsPattern: "hafif"
    });
    expect(appearance).toEqual({ themeName: "gece-koyu", fontFamily: "merriweather" });
  });

  it("bilinmeyen tema/font yok sayılır", () => {
    const { appearance } = toBackendUserHydration({ _id: "u1", theme: "yok", fontFamily: "comic" } as never);
    expect(appearance).toEqual({ themeName: undefined, fontFamily: undefined });
  });
});
