"use client";

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/providers";
import { createEmptyAppData, deriveInitialSelection } from "@/lib/app-data";
import { loadLocalAppData, saveLocalAppData } from "@/lib/local-app-data";
import { Language, LocalAppData } from "@/lib/types";

type UsePersistedAppDataResult = {
  appData: LocalAppData;
  setAppData: Dispatch<SetStateAction<LocalAppData>>;
  ready: boolean;
  selectedClassId: string;
  setSelectedClassId: Dispatch<SetStateAction<string>>;
  selectedSeatPlanId: string;
  setSelectedSeatPlanId: Dispatch<SetStateAction<string>>;
  applyDerivedSelection: (nextAppData: LocalAppData) => void;
};

export function usePersistedAppData(): UsePersistedAppDataResult {
  const { language, setLanguage } = useLanguage();
  const [appData, setAppData] = useState<LocalAppData>(() => createEmptyAppData(language));
  const [ready, setReady] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSeatPlanId, setSelectedSeatPlanId] = useState("");
  const pendingHydratedLanguageRef = useRef<Language | null>(null);
  const applyDerivedSelection = (nextAppData: LocalAppData) => {
    const selection = deriveInitialSelection(nextAppData);

    setSelectedClassId(selection.selectedClassId);
    setSelectedSeatPlanId(selection.selectedSeatPlanId);
  };

  useEffect(() => {
    if (ready) {
      return;
    }

    const loadedData = loadLocalAppData(language);
    pendingHydratedLanguageRef.current = loadedData.preferences.language;
    setAppData(loadedData);
    applyDerivedSelection(loadedData);

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

  return {
    appData,
    setAppData,
    ready,
    selectedClassId,
    setSelectedClassId,
    selectedSeatPlanId,
    setSelectedSeatPlanId,
    applyDerivedSelection,
  };
}
