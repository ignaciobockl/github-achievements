import type { Locale } from "./index";

export interface Messages {
  meta: {
    title: string;
    description: string;
  };
  placeholder: {
    eyebrow: string;
    title: string;
    subtitle: string;
    comingSoon: string;
  };
  theme: {
    label: string;
    light: string;
    dark: string;
    auto: string;
  };
  locale: {
    label: string;
  };
}

export const translations: Record<Locale, Messages> = {
  en: {
    meta: {
      title: "GitHub Achievements",
      description:
        "A guide to every GitHub profile achievement — how to unlock them, their tiers, and more.",
    },
    placeholder: {
      eyebrow: "Coming soon",
      title: "GitHub Achievements",
      subtitle:
        "A complete guide to every GitHub profile achievement, its tiers, and how to unlock each one.",
      comingSoon: "The catalog is being built. Stay tuned.",
    },
    theme: {
      label: "Theme",
      light: "Light",
      dark: "Dark",
      auto: "Auto",
    },
    locale: {
      label: "Language",
    },
  },
  es: {
    meta: {
      title: "Logros de GitHub",
      description:
        "Una guía de todos los logros del perfil de GitHub: cómo conseguirlos, sus niveles y más.",
    },
    placeholder: {
      eyebrow: "Muy pronto",
      title: "Logros de GitHub",
      subtitle:
        "Una guía completa de cada logro del perfil de GitHub, sus niveles y cómo conseguirlos.",
      comingSoon: "El catálogo está en construcción. Vuelve pronto.",
    },
    theme: {
      label: "Tema",
      light: "Claro",
      dark: "Oscuro",
      auto: "Automático",
    },
    locale: {
      label: "Idioma",
    },
  },
};
