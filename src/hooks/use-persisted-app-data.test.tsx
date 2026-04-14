import { act, createElement } from "react";
import { createRoot, Root } from "react-dom/client";
import { JSDOM } from "jsdom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createEmptyAppData } from "@/lib/app-data";
import { ClassroomRecord, Language, LocalAppData, SeatPlanRecord } from "@/lib/types";

import { usePersistedAppData } from "./use-persisted-app-data";

const testState = vi.hoisted(() => ({
  loadLocalAppDataMock: vi.fn<(language: "ko" | "en") => LocalAppData>(),
  saveLocalAppDataMock: vi.fn<(data: LocalAppData) => void>(),
  languageListeners: new Set<() => void>(),
  currentLanguage: "ko" as Language,
}));

function setMockLanguage(nextLanguage: Language) {
  testState.currentLanguage = nextLanguage;
  testState.languageListeners.forEach((listener) => listener());
}

vi.mock("@/components/providers", async () => {
  const React = await import("react");

  return {
    useLanguage() {
      const language = React.useSyncExternalStore(
        (listener) => {
          testState.languageListeners.add(listener);

          return () => {
            testState.languageListeners.delete(listener);
          };
        },
        () => testState.currentLanguage,
      );

      return {
        language,
        setLanguage: setMockLanguage,
      };
    },
  };
});

vi.mock("@/lib/local-app-data", () => ({
  LOCAL_APP_DATA_KEY: "class-random-seat-app-data",
  createLocalId: vi.fn(),
  loadLocalAppData: testState.loadLocalAppDataMock,
  saveLocalAppData: testState.saveLocalAppDataMock,
}));

function createClassroom(overrides: Partial<ClassroomRecord> = {}): ClassroomRecord {
  return {
    id: "class-alpha",
    name: "Alpha",
    memo: "",
    layoutTemplate: {
      rows: 4,
      pairsPerRow: 3,
    },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function createSeatPlan(overrides: Partial<SeatPlanRecord> = {}): SeatPlanRecord {
  return {
    id: "seatplan-alpha",
    title: "Plan A",
    assignmentMode: "random",
    layoutTemplate: {
      rows: 4,
      pairsPerRow: 3,
    },
    seats: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

type HookSnapshot = ReturnType<typeof usePersistedAppData> & {
  language: Language;
  setLanguage: (language: Language) => void;
};

function createPersistedAppData(language: "ko" | "en"): LocalAppData {
  return {
    version: 1,
    classes: [
      createClassroom({
        lastViewedSeatPlanId: "seatplan-alpha",
      }),
    ],
    studentsByClass: {
      "class-alpha": [],
    },
    seatPlansByClass: {
      "class-alpha": [createSeatPlan()],
    },
    preferences: {
      language,
      recentClassId: "class-alpha",
    },
  };
}

describe("usePersistedAppData", () => {
  let dom: JSDOM;
  let container: HTMLDivElement;
  let root: Root | null = null;
  let latestSnapshot: HookSnapshot | null = null;

  beforeEach(() => {
    dom = new JSDOM("<!doctype html><html><body></body></html>", {
      url: "http://localhost",
    });
    container = dom.window.document.createElement("div");
    dom.window.document.body.appendChild(container);

    vi.stubGlobal("window", dom.window);
    vi.stubGlobal("document", dom.window.document);
    vi.stubGlobal("navigator", dom.window.navigator);
    vi.stubGlobal("localStorage", dom.window.localStorage);
    vi.stubGlobal("HTMLElement", dom.window.HTMLElement);
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

    testState.loadLocalAppDataMock.mockReset();
    testState.saveLocalAppDataMock.mockReset();
    testState.languageListeners.clear();
    testState.currentLanguage = "ko";
    dom.window.localStorage.clear();
    dom.window.localStorage.setItem("class-random-seat-language", "ko");
    latestSnapshot = null;
    root = createRoot(container);
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
      root = null;
    }
    vi.unstubAllGlobals();
  });

  it("syncs hydrated language, preserves hydrated data until ready, and updates preferences on later language changes", async () => {
    const persistedAppData = createPersistedAppData("en");
    testState.loadLocalAppDataMock.mockReturnValue(persistedAppData);

    function Harness() {
      const persisted = usePersistedAppData();

      latestSnapshot = {
        ...persisted,
        language: testState.currentLanguage,
        setLanguage: setMockLanguage,
      };

      return null;
    }

    await act(async () => {
      root.render(createElement(Harness));
    });

    expect(testState.loadLocalAppDataMock).toHaveBeenCalledWith("ko");
    expect(latestSnapshot?.ready).toBe(true);
    expect(latestSnapshot?.language).toBe("en");
    expect(latestSnapshot?.appData.preferences.language).toBe("en");
    expect(latestSnapshot?.selectedClassId).toBe("class-alpha");
    expect(latestSnapshot?.selectedSeatPlanId).toBe("seatplan-alpha");
    expect(testState.saveLocalAppDataMock).toHaveBeenCalledTimes(1);
    expect(testState.saveLocalAppDataMock.mock.calls[0]?.[0]).toEqual(persistedAppData);
    expect(testState.saveLocalAppDataMock).not.toHaveBeenCalledWith(createEmptyAppData("ko"));

    await act(async () => {
      latestSnapshot?.setLanguage("ko");
    });

    expect(latestSnapshot?.language).toBe("ko");
    expect(latestSnapshot?.appData.preferences.language).toBe("ko");
    expect(testState.saveLocalAppDataMock).toHaveBeenLastCalledWith({
      ...persistedAppData,
      preferences: {
        ...persistedAppData.preferences,
        language: "ko",
      },
    });
  });
});
