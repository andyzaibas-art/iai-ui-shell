import React, { createContext, useContext, useMemo, useState } from "react";

import en from "./locales/en";
import sv from "./locales/sv";
import lt from "./locales/lt";
import no from "./locales/no";
import fi from "./locales/fi";
import et from "./locales/et";
import lv from "./locales/lv";
import pl from "./locales/pl";
import de from "./locales/de";
import da from "./locales/da";
import nl from "./locales/nl";

export type LocaleCode =
  | "en"
  | "sv"
  | "no"
  | "fi"
  | "et"
  | "lv"
  | "lt"
  | "pl"
  | "de"
  | "da"
  | "nl";

const STORAGE_KEY = "iai_locale_v1";

const dictionaries: Record<LocaleCode, Record<string, string>> = {
  en: en as any,
  sv: sv as any,
  no: no as any,
  fi: fi as any,
  et: et as any,
  lv: lv as any,
  lt: lt as any,
  pl: pl as any,
  de: de as any,
  da: da as any,
  nl: nl as any,
};

function loadLocale(): LocaleCode {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (
    raw === "en" ||
    raw === "sv" ||
    raw === "no" ||
    raw === "fi" ||
    raw === "et" ||
    raw === "lv" ||
    raw === "lt" ||
    raw === "pl" ||
    raw === "de" ||
    raw === "da" ||
    raw === "nl"
  ) {
    return raw;
  }
  return "en";
}

function saveLocale(locale: LocaleCode) {
  localStorage.setItem(STORAGE_KEY, locale);
}

type I18nCtx = {
  locale: LocaleCode;
  setLocale: (l: LocaleCode) => void;
  t: (key: string) => string;
};

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(() => loadLocale());

  const value = useMemo<I18nCtx>(() => {
    const t = (key: string) => {
      const dict = dictionaries[locale] ?? {};
      return dict[key] ?? dictionaries.en[key] ?? key;
    };

    const setLocale = (l: LocaleCode) => {
      setLocaleState(l);
      saveLocale(l);
    };

    return { locale, setLocale, t };
  }, [locale]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

export type LocaleItem = { code: LocaleCode; label: string; flag: string };

export const LOCALES: LocaleItem[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "sv", label: "Svenska", flag: "🇸🇪" },
  { code: "no", label: "Norsk (Bokmål)", flag: "🇳🇴" },
  { code: "fi", label: "Suomi", flag: "🇫🇮" },
  { code: "et", label: "Eesti", flag: "🇪🇪" },
  { code: "lv", label: "Latviešu", flag: "🇱🇻" },
  { code: "lt", label: "Lietuvių", flag: "🇱🇹" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "da", label: "Dansk", flag: "🇩🇰" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
];


