import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpApi from "i18next-http-backend";

import enTranslations from "./translations/en.json";
import esTranslations from "./translations/es.json";

i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(HttpApi)
  .init({
    resources: {
      en: {
        translation: enTranslations
      },
      es: {
        translation: esTranslations
      }
    },
    fallbackLng: "en",
    debug: process.env.NODE_ENV === 'development', // Only show debug in development
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator']
    }
  });

export default i18n;