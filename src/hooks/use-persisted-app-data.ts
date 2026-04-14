"use client";

import { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/components/providers";
import { createEmptyAppData, deriveInitialSelection } from "@/lib/app-data";
import { loadLocalAppData, saveLocalAppData } from "@/lib/local-app-data";
import { Language, LocalAppData } from "@/lib/types";

type UsePersistedAppDataResult = {
  appData: LocalAppData;
  setAppData: Dispatch<SetStateAction<LocalAppData>>;
  ready: boolean;
  initialSelection: ReturnType<typeof deriveInitialSelection>;
};

export function usePersistedAppData(): UsePersistedAppDataResult {
  const { language, setLanguage } = useLanguage();
  const [appData, setAppData] = useState<LocalAppData>(() => createEmptyAppData(language));
  const [ready, setReady] = useState(false);
  const pendingHydratedLanguageRef = useRef<Language | null>(null);

  useEffect(() => {
    if (ready) {
      return;
    }

    const loadedData = loadLocalAppData(language);
    pendingHydratedLanguageRef.current = loadedData.preferences.language;
    setAppData(loadedData);

    if (loadedData.preferences.language !== language) {
      setLanguage(loadedData.preferences.language);
    }

    setReady(true);
  }, [language, ready, setLanguage]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    saveLocalAppData(appData);
  }, [appData, ready]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (pendingHydratedLanguageRef.current && pendingHydratedLanguageRef.current !== language) {
      return;
    }

    pendingHydratedLanguageRef.current = null;

    if (appData.preferences.language === language) {
      return;
    }

    setAppData((current) => {
      if (current.preferences.language === language) {
        return current;
      }

      return {
        ...current,
        preferences: {
          ...current.preferences,
          language,
        },
      };
    });
  }, [appData.preferences.language, language, ready]);

  const initialSelection = useMemo(() => deriveInitialSelection(appData), [appData]);

  return {
    appData,
    setAppData,
    ready,
    initialSelection,
  };
}
