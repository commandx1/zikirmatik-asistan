import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";

// widget-task-handler headless çalışır; AsyncStorage ve
// react-native-android-widget'ı gerçek native koddan izole etmek için
// mock'larız (bkz. use-dhikr-backend-sync.test.ts'teki desen).
const multiGetMock = vi.fn();
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: { multiGet: multiGetMock }
}));

const requestWidgetUpdateMock = vi.fn();
vi.mock("react-native-android-widget", () => ({
  requestWidgetUpdate: requestWidgetUpdateMock
}));

// widgets.tsx JSX + ham React pragma içerir; burada saf davranışı test
// ettiğimizden gerçek render'ı devre dışı bırakıp WIDGET_NAMES listesini
// koruyarak basit bir stub'a indirgeriz.
vi.mock("./widgets", () => ({
  WIDGET_NAMES: ["Streak", "Vird"],
  renderWidgetByName: (name: string, snap: unknown) =>
    name === "Streak" || name === "Vird" ? { name, snap } : null
}));

const buildWidgetSnapshotMock = vi.fn();
vi.mock("./widget-snapshot", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./widget-snapshot")>();
  return { ...actual, buildWidgetSnapshot: buildWidgetSnapshotMock };
});

const { widgetTaskHandler, readWidgetRaw } = await import("./widget-task-handler");
const { WIDGET_STORAGE_KEYS } = await import("./widget-snapshot");

function makeProps(overrides: Partial<WidgetTaskHandlerProps> = {}): WidgetTaskHandlerProps {
  return {
    widgetAction: "WIDGET_UPDATE",
    widgetInfo: { widgetName: "Streak" } as WidgetTaskHandlerProps["widgetInfo"],
    renderWidget: vi.fn(),
    ...overrides
  } as WidgetTaskHandlerProps;
}

beforeEach(() => {
  multiGetMock.mockReset();
  requestWidgetUpdateMock.mockReset();
  buildWidgetSnapshotMock.mockReset();
  multiGetMock.mockResolvedValue([]);
  buildWidgetSnapshotMock.mockReturnValue({ fake: "snapshot" });
  requestWidgetUpdateMock.mockResolvedValue(undefined);
});

describe("widgetTaskHandler", () => {
  it("WIDGET_UPDATE + Streak: kendi widget'ını çizer, diğerini (Vird) tazeler, kendi adı için requestWidgetUpdate çağrılmaz", async () => {
    const props = makeProps({ widgetAction: "WIDGET_UPDATE", widgetInfo: { widgetName: "Streak" } as never });

    await widgetTaskHandler(props);

    expect(props.renderWidget).toHaveBeenCalledTimes(1);
    expect(requestWidgetUpdateMock).toHaveBeenCalledTimes(1);
    expect(requestWidgetUpdateMock).toHaveBeenCalledWith(expect.objectContaining({ widgetName: "Vird" }));
    expect(requestWidgetUpdateMock).not.toHaveBeenCalledWith(expect.objectContaining({ widgetName: "Streak" }));
  });

  it("WIDGET_ADDED + Vird: renderWidget 1 kez, requestWidgetUpdate Streak için", async () => {
    const props = makeProps({ widgetAction: "WIDGET_ADDED", widgetInfo: { widgetName: "Vird" } as never });

    await widgetTaskHandler(props);

    expect(props.renderWidget).toHaveBeenCalledTimes(1);
    expect(requestWidgetUpdateMock).toHaveBeenCalledTimes(1);
    expect(requestWidgetUpdateMock).toHaveBeenCalledWith(expect.objectContaining({ widgetName: "Streak" }));
  });

  it("WIDGET_RESIZED aynı yolu izler", async () => {
    const props = makeProps({ widgetAction: "WIDGET_RESIZED", widgetInfo: { widgetName: "Streak" } as never });

    await widgetTaskHandler(props);

    expect(props.renderWidget).toHaveBeenCalledTimes(1);
    expect(requestWidgetUpdateMock).toHaveBeenCalledTimes(1);
    expect(requestWidgetUpdateMock).toHaveBeenCalledWith(expect.objectContaining({ widgetName: "Vird" }));
  });

  it("WIDGET_DELETED: renderWidget/requestWidgetUpdate/multiGet hiç çağrılmaz", async () => {
    const props = makeProps({ widgetAction: "WIDGET_DELETED" as never });

    await widgetTaskHandler(props);

    expect(props.renderWidget).not.toHaveBeenCalled();
    expect(requestWidgetUpdateMock).not.toHaveBeenCalled();
    expect(multiGetMock).not.toHaveBeenCalled();
  });

  it("WIDGET_CLICK: renderWidget/requestWidgetUpdate/multiGet hiç çağrılmaz", async () => {
    const props = makeProps({ widgetAction: "WIDGET_CLICK" as never });

    await widgetTaskHandler(props);

    expect(props.renderWidget).not.toHaveBeenCalled();
    expect(requestWidgetUpdateMock).not.toHaveBeenCalled();
    expect(multiGetMock).not.toHaveBeenCalled();
  });

  it("bilinmeyen widgetName ('Foo'): renderWidgetByName null döner, handler erken çıkar, throw yok", async () => {
    const props = makeProps({ widgetAction: "WIDGET_UPDATE", widgetInfo: { widgetName: "Foo" } as never });

    await expect(widgetTaskHandler(props)).resolves.toBeUndefined();
    expect(props.renderWidget).not.toHaveBeenCalled();
    // widget === null olduğunda handler diğer widget'ları tazeleme
    // döngüsüne hiç girmeden döner.
    expect(requestWidgetUpdateMock).not.toHaveBeenCalled();
  });

  it("AsyncStorage.multiGet reject ederse throw yok, renderWidget yine çağrılır", async () => {
    multiGetMock.mockRejectedValueOnce(new Error("storage patladı"));
    const props = makeProps();

    await expect(widgetTaskHandler(props)).resolves.toBeUndefined();
    expect(props.renderWidget).toHaveBeenCalledTimes(1);
  });

  it("requestWidgetUpdate reject ederse handler throw etmez, renderWidget çağrılmış olur", async () => {
    requestWidgetUpdateMock.mockRejectedValueOnce(new Error("update patladı"));
    const props = makeProps();

    await expect(widgetTaskHandler(props)).resolves.toBeUndefined();
    expect(props.renderWidget).toHaveBeenCalledTimes(1);
  });
});

describe("readWidgetRaw", () => {
  it("multiGet çiftlerini doğru alanlara eşler, eksik anahtar için null döner", async () => {
    multiGetMock.mockResolvedValueOnce([
      [WIDGET_STORAGE_KEYS.dhikrStore, "dhikr-json"],
      [WIDGET_STORAGE_KEYS.virdStore, "vird-json"],
      [WIDGET_STORAGE_KEYS.circleStore, "circle-json"],
      [WIDGET_STORAGE_KEYS.profileStore, "profile-json"]
      // themeStore ve widgetState kasıtlı eksik
    ]);

    const raw = await readWidgetRaw();

    expect(raw).toEqual({
      dhikrStore: "dhikr-json",
      virdStore: "vird-json",
      circleStore: "circle-json",
      profileStore: "profile-json",
      themeStore: null,
      widgetState: null
    });
  });

  it("multiGet reject ederse tüm alanlar null döner, throw yok", async () => {
    multiGetMock.mockRejectedValueOnce(new Error("boom"));

    await expect(readWidgetRaw()).resolves.toEqual({
      dhikrStore: null,
      virdStore: null,
      circleStore: null,
      profileStore: null,
      themeStore: null,
      widgetState: null
    });
  });
});
