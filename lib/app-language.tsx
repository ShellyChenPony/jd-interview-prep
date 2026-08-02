'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  DEFAULT_RESUME_LANGUAGE,
  getResumeLanguage,
  normalizeResumeLanguage,
  type ResumeLanguageCode,
} from '@/lib/resume-languages';
import { getUiCopy, type UiCopy } from '@/lib/ui-copy';

const STORAGE_KEY = 'app-language';

type AppLanguageContextValue = {
  language: ResumeLanguageCode;
  setLanguage: (code: ResumeLanguageCode) => void;
  promptName: string;
  t: UiCopy;
};

const AppLanguageContext = createContext<AppLanguageContextValue | null>(null);

function readStoredLanguage(): ResumeLanguageCode {
  if (typeof window === 'undefined') return DEFAULT_RESUME_LANGUAGE;
  try {
    return normalizeResumeLanguage(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    // ignore
  }
  return DEFAULT_RESUME_LANGUAGE;
}

export function AppLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<ResumeLanguageCode>(DEFAULT_RESUME_LANGUAGE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLanguageState(readStoredLanguage());
    setHydrated(true);
  }, []);

  const setLanguage = (code: ResumeLanguageCode) => {
    setLanguageState(code);
    try {
      window.localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // ignore
    }
  };

  const value = useMemo<AppLanguageContextValue>(() => {
    const meta = getResumeLanguage(language);
    return {
      language,
      setLanguage,
      promptName: meta.promptName,
      t: getUiCopy(language),
    };
  }, [language]);

  // Avoid SSR/client label mismatch flashing wrong language.
  if (!hydrated) {
    return (
      <AppLanguageContext.Provider
        value={{
          language: DEFAULT_RESUME_LANGUAGE,
          setLanguage,
          promptName: getResumeLanguage(DEFAULT_RESUME_LANGUAGE).promptName,
          t: getUiCopy(DEFAULT_RESUME_LANGUAGE),
        }}
      >
        {children}
      </AppLanguageContext.Provider>
    );
  }

  return (
    <AppLanguageContext.Provider value={value}>{children}</AppLanguageContext.Provider>
  );
}

export function useAppLanguage(): AppLanguageContextValue {
  const ctx = useContext(AppLanguageContext);
  if (!ctx) {
    throw new Error('useAppLanguage must be used within AppLanguageProvider');
  }
  return ctx;
}
