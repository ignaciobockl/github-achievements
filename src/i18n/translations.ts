import type { Locale } from "./index";

export interface Messages {
  meta: {
    title: string;
    description: string;
  };
  nav: {
    home: string;
    collection: string;
    tiers: string;
    criteria: string;
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
  top10: {
    title: string;
    subtitle: string;
    generated_at: string;
    rank: string;
    user: string;
    achievements: string;
    tiers: string;
    score: string;
    no_data: string;
    loading: string;
    error: string;
  };
  landing: {
    meta: {
      title: string;
      description: string;
    };
    nav: {
      home: string;
      collection: string;
      tiers: string;
      criteria: string;
    };
    kicker: {
      prefix: string;
    };
    hero: {
      title: string;
      lead: string;
      cta: string;
      meta: string;
    };
    stats: {
      label1: string;
      value1: string;
      note1: string;
      label2: string;
      value2: string;
      note2: string;
      label3: string;
      value3: string;
      note3: string;
    };
    section: {
      collectionTitle: string;
      collectionSubtitle: string;
      tiersTitle: string;
      tiersSubtitle: string;
    };
    tier: {
      badge: string;
      criteria: string;
    };
    note: {
      title: string;
      body: string;
      portNote: string;
    };
    cta: {
      title: string;
      lead: string;
      button: string;
      footnote: string;
    };
    footer: {
      brand: string;
      links: string;
    };
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
      collection: "Collection",
      tiers: "Tiers",
      criteria: "Criteria",
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
    top10: {
      title: "Top 10 Leaderboard",
      subtitle: "GitHub users with the most achievements",
      generated_at: "Generated at",
      rank: "Rank",
      user: "User",
      achievements: "Achievements",
      tiers: "Tiers",
      score: "Score",
      no_data: "No data available",
      loading: "Loading leaderboard...",
      error: "Failed to load leaderboard",
    },
    landing: {
      meta: {
        title: "GitHub Achievements",
        description:
          "Your GitHub milestones as editorial milestones: tiers, criteria, and real progression. No empty gamification.",
      },
      nav: {
        home: "Home",
        collection: "Collection",
        tiers: "Tiers",
        criteria: "Criteria",
      },
      kicker: {
        prefix: "Collection, GitHub Profile",
      },
      hero: {
        title: "Your code milestones, counted with calm.",
        lead: "No streaks, no points. An editorial showcase that orders your real badges by tier, shows the exact criteria, and lets the work speak.",
        cta: "View the collection ↓",
        meta: "9 badges, 4 with tiers",
      },
      stats: {
        label1: "Badges in this showcase",
        value1: "09",
        note1: "src/data/achievements.ts",
        label2: "Max tiers reached",
        value2: "x4",
        note2: "bronze → gold",
        label3: "Verifiable criteria",
        value3: "100%",
        note3: "no invented metrics",
      },
      section: {
        collectionTitle: "The collection",
        collectionSubtitle: "Chronological catalog order. Hover: the card breathes, nothing jumps.",
        tiersTitle: "Tiers",
        tiersSubtitle: "Hover a card: it breathes, nothing pops.",
      },
      tier: {
        badge: "Badge",
        criteria: "criteria",
      },
      note: {
        title: "How to read this page.",
        body: "Each card shows the literal GitHub criteria. If data isn't verified, it's labeled as such; no invented numbers.",
        portNote:
          "To port to the repo: replace these six cards with a map over <strong>src/data/achievements.ts</strong> using <strong>src/data/localize.ts</strong>. The rest of the layout stays the same.",
      },
      cta: {
        title: "Connect your profile and get your showcase ready.",
        lead: "One link, your badges ordered, in light and dark. No plugins, no excess animations.",
        button: "Publish my showcase →",
        footnote: "nomin, /es and /en, no libraries",
      },
      footer: {
        brand: "Editorial showcase — zinc + emerald. Satoshi + Geist Mono.",
        links: "GitHub Criteria, Accessibility",
      },
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
      collection: "Colección",
      tiers: "Niveles",
      criteria: "Criterios",
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
    top10: {
      title: "Clasificación Top 10",
      subtitle: "Usuarios de GitHub con más logros",
      generated_at: "Generado el",
      rank: "Posición",
      user: "Usuario",
      achievements: "Logros",
      tiers: "Niveles",
      score: "Puntuación",
      no_data: "No hay datos disponibles",
      loading: "Cargando clasificación...",
      error: "Error al cargar la clasificación",
    },
    landing: {
      meta: {
        title: "Logros de GitHub",
        description:
          "Tus hitos de GitHub contados como hitos editoriales: niveles, criterios y progresión real. Sin gamificación vacía.",
      },
      nav: {
        home: "Inicio",
        collection: "Colección",
        tiers: "Niveles",
        criteria: "Criterios",
      },
      kicker: {
        prefix: "Colección, Perfil de GitHub",
      },
      hero: {
        title: "Tus hitos de código, contados con calma.",
        lead: "Ni rachas ni puntos. Una vitrina editorial que ordena tus insignias reales por nivel, muestra el criterio exacto y deja que el trabajo hable.",
        cta: "Ver la colección ↓",
        meta: "9 insignias, 4 con nivel",
      },
      stats: {
        label1: "Insignias en esta vitrina",
        value1: "09",
        note1: "src/data/achievements.ts",
        label2: "Niveles máximos alcanzados",
        value2: "x4",
        note2: "bronce → oro",
        label3: "Criterios verificables",
        value3: "100%",
        note3: "sin métricas inventadas",
      },
      section: {
        collectionTitle: "La colección",
        collectionSubtitle:
          "Orden cronológico de catálogo. Pasa el cursor: la ficha respira, nada salta.",
        tiersTitle: "Niveles",
        tiersSubtitle: "Pasa el cursor: la ficha respira, nada salta.",
      },
      tier: {
        badge: "Insignia",
        criteria: "criterio",
      },
      note: {
        title: "Cómo leer esta página.",
        body: "Cada ficha muestra el criterio literal de GitHub. Si un dato no está verificado, se etiqueta como tal; no se inventan cifras.",
        portNote:
          "Para portar al repo: sustituye estas seis fichas por el map sobre <strong>src/data/achievements.ts</strong> con <strong>src/data/localize.ts</strong>. El resto del layout queda igual.",
      },
      cta: {
        title: "Conecta tu perfil y deja tu vitrina lista.",
        lead: "Un enlace, tus insignias ordenadas, en claro y oscuro. Sin plugins, sin animaciones de más.",
        button: "Publicar mi vitrina →",
        footnote: "nomin, /es y /en, sin librerías",
      },
      footer: {
        brand: "Vitrina editorial — zinc + emerald. Satoshi + Geist Mono.",
        links: "Criterios GitHub, Accesibilidad",
      },
    },
  },
};
