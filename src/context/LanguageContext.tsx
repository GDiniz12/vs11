"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Language = "en" | "pt";

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Configurado o Português ("pt") como idioma padrão inicial
  const [lang, setLang] = useState<Language>("pt");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("lang");
      if (stored === "pt" || stored === "en") setLang(stored as Language);
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("lang", lang);
      document.documentElement.lang = lang === "pt" ? "pt" : "en";
    } catch (e) {
      // ignore
    }
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}