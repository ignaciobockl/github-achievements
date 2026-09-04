import type { Locale } from "./index";

export interface Messages {
  meta: {
    title: string;
    description: string;
  };
  nav: {
    home: string;
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
  catalog: {
    title: string;
    subtitle: string;
    total: string;
    earnable: string;
    notEarnable: string;
    filterAll: string;
    filterEarnable: string;
    filterObsolete: string;
    filterInternal: string;
    filterDisabled: string;
    search: string;
    noResults: string;
    howToGet: string;
    tiers: string;
    tier: string;
    noTiers: string;
    references: string;
    previousNames: string;
    back: string;
  };
  categories: {
    earnable: string;
    obsolete: string;
    internal: string;
    disabled: string;
  };
  earnability: {
    earnable: string;
    "not-earnable": string;
    internal: string;
    disabled: string;
    "being-tested": string;
  };
  tierNames: {
    default: string;
    bronze: string;
    silver: string;
    gold: string;
  };
  repoAnalyzer: {
    title: string;
    subtitle: string;
    usernameLabel: string;
    usernamePlaceholder: string;
    repoLabel: string;
    repoPlaceholder: string;
    analyzeButton: string;
    analyzingButton: string;
    loading: string;
    error: string;
    rateLimitError: string;
    notFoundError: string;
    genericError: string;
    retryButton: string;
    achievements: string;
    noAchievements: string;
    repoInfo: string;
    stars: string;
    forks: string;
    watchers: string;
    language: string;
    createdAt: string;
    updatedAt: string;
    pushedAt: string;
    tier: string;
    progress: string;
    nextTier: string;
    earnedAt: string;
    badge: string;
  };
}

export const translations: Record<Locale, Messages> = {
  en: {
    meta: {
      title: "GitHub Achievements",
      description:
        "A guide to every GitHub profile achievement — how to unlock them, their tiers, and more.",
    },
    nav: {
      home: "Home",
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
    catalog: {
      title: "GitHub Achievements",
      subtitle: "Every achievement, its tiers, and how to unlock each one.",
      total: "achievements",
      earnable: "Earnable",
      notEarnable: "Not earnable",
      filterAll: "All",
      filterEarnable: "Earnable",
      filterObsolete: "Obsolete",
      filterInternal: "Internal",
      filterDisabled: "Disabled",
      search: "Search achievements…",
      noResults: "No achievements match your search.",
      howToGet: "How to get it",
      tiers: "Tiers",
      tier: "Tier",
      noTiers: "This achievement has no tiers.",
      references: "References",
      previousNames: "Previous names",
      back: "Back to all achievements",
    },
    categories: {
      earnable: "Earnable",
      obsolete: "Obsolete",
      internal: "Internal",
      disabled: "Disabled",
    },
    earnability: {
      earnable: "Earnable",
      "not-earnable": "No longer earnable",
      internal: "Internal (staff only)",
      disabled: "Disabled",
      "being-tested": "Being tested",
    },
    tierNames: {
      default: "Default",
      bronze: "Bronze",
      silver: "Silver",
      gold: "Gold",
    },
    repoAnalyzer: {
      title: "Repository Analyzer",
      subtitle: "Analyze GitHub achievements for a user or repository",
      usernameLabel: "GitHub Username",
      usernamePlaceholder: "Enter GitHub username",
      repoLabel: "Repository (optional)",
      repoPlaceholder: "owner/repo (e.g., octocat/Hello-World)",
      analyzeButton: "Analyze",
      analyzingButton: "Analyzing...",
      loading: "Fetching data...",
      error: "Error",
      rateLimitError: "Rate limit exceeded. Please wait before trying again.",
      notFoundError: "User or repository not found.",
      genericError: "An error occurred while fetching data.",
      retryButton: "Try Again",
      achievements: "Achievements",
      noAchievements: "No achievements found for this user.",
      repoInfo: "Repository Info",
      stars: "Stars",
      forks: "Forks",
      watchers: "Watchers",
      language: "Language",
      createdAt: "Created",
      updatedAt: "Updated",
      pushedAt: "Last Push",
      tier: "Tier",
      progress: "Progress",
      nextTier: "Next tier",
      earnedAt: "Earned at",
      badge: "Badge",
    },
  },
  es: {
    meta: {
      title: "Logros de GitHub",
      description:
        "Una guía de todos los logros del perfil de GitHub: cómo conseguirlos, sus niveles y más.",
    },
    nav: {
      home: "Inicio",
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
    catalog: {
      title: "Logros de GitHub",
      subtitle: "Cada logro, sus niveles y cómo conseguirlos.",
      total: "logros",
      earnable: "Conseguible",
      notEarnable: "No conseguible",
      filterAll: "Todos",
      filterEarnable: "Conseguibles",
      filterObsolete: "Obsoletos",
      filterInternal: "Internos",
      filterDisabled: "Deshabilitados",
      search: "Buscar logros…",
      noResults: "Ningún logro coincide con tu búsqueda.",
      howToGet: "Cómo conseguirlo",
      tiers: "Niveles",
      tier: "Nivel",
      noTiers: "Este logro no tiene niveles.",
      references: "Referencias",
      previousNames: "Nombres anteriores",
      back: "Volver a todos los logros",
    },
    categories: {
      earnable: "Conseguible",
      obsolete: "Obsoleto",
      internal: "Interno",
      disabled: "Deshabilitado",
    },
    earnability: {
      earnable: "Conseguible",
      "not-earnable": "Ya no se puede conseguir",
      internal: "Interno (solo staff)",
      disabled: "Deshabilitado",
      "being-tested": "En pruebas",
    },
    tierNames: {
      default: "Predeterminado",
      bronze: "Bronce",
      silver: "Plata",
      gold: "Oro",
    },
    repoAnalyzer: {
      title: "Analizador de Repositorio",
      subtitle: "Analiza los logros de GitHub de un usuario o repositorio",
      usernameLabel: "Usuario de GitHub",
      usernamePlaceholder: "Introduce el usuario de GitHub",
      repoLabel: "Repositorio (opcional)",
      repoPlaceholder: "propietario/repo (ej. octocat/Hello-World)",
      analyzeButton: "Analizar",
      analyzingButton: "Analizando...",
      loading: "Obteniendo datos...",
      error: "Error",
      rateLimitError: "Límite de peticiones excedido. Espera antes de volver a intentarlo.",
      notFoundError: "Usuario o repositorio no encontrado.",
      genericError: "Ocurrió un error al obtener los datos.",
      retryButton: "Reintentar",
      achievements: "Logros",
      noAchievements: "No se encontraron logros para este usuario.",
      repoInfo: "Información del repositorio",
      stars: "Estrellas",
      forks: "Bifurcaciones",
      watchers: "Observadores",
      language: "Lenguaje",
      createdAt: "Creado",
      updatedAt: "Actualizado",
      pushedAt: "Último push",
      tier: "Nivel",
      progress: "Progreso",
      nextTier: "Siguiente nivel",
      earnedAt: "Conseguido el",
      badge: "Insignia",
    },
  },
};
