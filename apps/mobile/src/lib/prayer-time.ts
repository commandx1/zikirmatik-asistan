export type PrayerTimeEntry = {
  vakit: string;
  saat: string;
};

type PrayerSlot = {
  name: string;
  minutes: number;
};

export function formatCurrentPrayerLabel(
  times: PrayerTimeEntry[],
  now: Date = new Date(),
) {
  const slots = normalizeSlots(times);
  if (slots.length === 0) {
    return "Vakit bilgisi yok";
  }

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const current = resolveCurrentPrayer(slots, nowMinutes);
  return `${current.name} vakti`;
}

export function formatWeekdayLabel(date: Date = new Date()) {
  const day = new Intl.DateTimeFormat("tr-TR", { weekday: "long" }).format(date);
  return `${capitalize(day)} günü`;
}

function normalizeSlots(times: PrayerTimeEntry[]) {
  return times
    .map((item) => {
      const minutes = parseTimeToMinutes(item.saat);
      if (minutes === null || !item.vakit?.trim()) {
        return null;
      }

      return {
        name: item.vakit.trim(),
        minutes,
      } satisfies PrayerSlot;
    })
    .filter((item): item is PrayerSlot => Boolean(item))
    .sort((a, b) => a.minutes - b.minutes);
}

function resolveCurrentPrayer(slots: PrayerSlot[], nowMinutes: number) {
  for (let i = 0; i < slots.length; i += 1) {
    const current = slots[i];
    const next = slots[i + 1];

    if (!next && nowMinutes >= current.minutes) {
      return current;
    }

    if (next && nowMinutes >= current.minutes && nowMinutes < next.minutes) {
      return current;
    }
  }

  // If the time is before the first slot, keep the previous day's last prayer.
  return slots[slots.length - 1];
}

function parseTimeToMinutes(raw: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(raw.trim());
  if (!match) {
    return null;
  }

  const hour = Number.parseInt(match[1], 10);
  const minute = Number.parseInt(match[2], 10);
  return hour * 60 + minute;
}

function capitalize(value: string) {
  if (!value) {
    return value;
  }

  return `${value.charAt(0).toLocaleUpperCase("tr-TR")}${value.slice(1)}`;
}
