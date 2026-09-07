import type { Achievement, SkinTone } from "./types";

const BADGE_BASE =
  "https://raw.githubusercontent.com/Schweinepriester/github-profile-achievements/main/images";

export const achievements: Achievement[] = [
  {
    slug: "pair-extraordinaire",
    title: { en: "Pair Extraordinaire", es: "Pair Extraordinaire" },
    category: "earnable",
    earnable: true,
    earnability: "earnable",
    badge: {
      default: `${BADGE_BASE}/pair-extraordinaire-default.png`,
      bronze: `${BADGE_BASE}/tiers/pair-extraordinaire-bronze.png`,
      silver: `${BADGE_BASE}/tiers/pair-extraordinaire-silver.png`,
      gold: `${BADGE_BASE}/tiers/pair-extraordinaire-gold.png`,
    },
    summary: {
      en: "Coauthor commits in merged pull requests.",
      es: "Coautoría de commits en pull requests ya fusionados.",
    },
    howToGet: {
      en: [
        "Coauthor a commit that lands in a merged pull request.",
        "Use the Co-authored-by trailer in the commit message to record multiple authors.",
        "Repeat across more pull requests to climb the tiers.",
      ],
      es: [
        "Coautoriza un commit que termine en un pull request fusionado.",
        "Usa la línea Co-authored-by en el mensaje del commit para registrar varios autores.",
        "Repite en más pull requests para subir de nivel.",
      ],
    },
    tiers: [
      {
        tier: "bronze",
        label: "x2",
        emoji: "🥉",
        hex: "#F9BFA7",
        criterion: {
          en: "Coauthored in 10 merged pull requests.",
          es: "Coautoría en 10 pull requests fusionados.",
        },
      },
      {
        tier: "silver",
        label: "x3",
        emoji: "🥈",
        hex: "#E1E4E4",
        criterion: {
          en: "Coauthored in 24 merged pull requests.",
          es: "Coautoría en 24 pull requests fusionados.",
        },
      },
      {
        tier: "gold",
        label: "x4",
        emoji: "🥇",
        hex: "#FAE57E",
        criterion: {
          en: "Coauthored in 48 merged pull requests.",
          es: "Coautoría en 48 pull requests fusionados.",
        },
      },
    ],
    references: [
      {
        label: {
          en: "Creating a commit with multiple authors",
          es: "Crear un commit con varios autores",
        },
        url: "https://docs.github.com/pull-requests/committing-changes-to-your-project/creating-and-editing-commits/creating-a-commit-with-multiple-authors",
      },
    ],
  },
  {
    slug: "quickdraw",
    title: { en: "Quickdraw", es: "Quickdraw" },
    category: "earnable",
    earnable: true,
    earnability: "earnable",
    badge: {
      default: `${BADGE_BASE}/quickdraw-default.png`,
    },
    variants: ["light", "light-medium", "medium", "medium-dark", "dark"] as SkinTone[],
    summary: {
      en: "Close an issue or pull request within 5 minutes of opening it.",
      es: "Cierra un issue o pull request dentro de los 5 minutos de abrirlo.",
    },
    howToGet: {
      en: [
        "Open an issue or pull request and close it within 5 minutes.",
        "This is the base achievement; it has no tiers.",
      ],
      es: [
        "Abre un issue o pull request y ciérralo dentro de 5 minutos.",
        "Es el logro base; no tiene niveles.",
      ],
    },
    tiers: [],
    references: [],
  },
  {
    slug: "starstruck",
    title: { en: "Starstruck", es: "Starstruck" },
    category: "earnable",
    earnable: true,
    earnability: "earnable",
    badge: {
      default: `${BADGE_BASE}/starstruck-default.png`,
      bronze: `${BADGE_BASE}/tiers/starstruck-bronze.png`,
      silver: `${BADGE_BASE}/tiers/starstruck-silver.png`,
      gold: `${BADGE_BASE}/tiers/starstruck-gold.png`,
    },
    variants: ["light", "light-medium", "medium", "medium-dark", "dark"] as SkinTone[],
    summary: {
      en: "Create a repository that earns stars.",
      es: "Crea un repositorio que acumule estrellas.",
    },
    howToGet: {
      en: ["Create a public repository that gains stars."],
      es: ["Crea un repositorio público que gane estrellas."],
    },
    tiers: [
      {
        tier: "bronze",
        label: "x2",
        emoji: "🥉",
        hex: "#F9BFA7",
        criterion: {
          en: "Created a repository that has 128 stars.",
          es: "Creaste un repositorio con 128 estrellas.",
        },
      },
      {
        tier: "silver",
        label: "x3",
        emoji: "🥈",
        hex: "#E1E4E4",
        criterion: {
          en: "Created a repository that has 512 stars.",
          es: "Creaste un repositorio con 512 estrellas.",
        },
      },
      {
        tier: "gold",
        label: "x4",
        emoji: "🥇",
        hex: "#FAE57E",
        criterion: {
          en: "Created a repository that has 4096 stars.",
          es: "Creaste un repositorio con 4096 estrellas.",
        },
      },
    ],
    references: [],
  },
  {
    slug: "galaxy-brain",
    title: { en: "Galaxy Brain", es: "Galaxy Brain" },
    category: "earnable",
    earnable: true,
    earnability: "earnable",
    badge: {
      default: `${BADGE_BASE}/galaxy-brain-default.png`,
      bronze: `${BADGE_BASE}/tiers/galaxy-brain-bronze.png`,
      silver: `${BADGE_BASE}/tiers/galaxy-brain-silver.png`,
      gold: `${BADGE_BASE}/tiers/galaxy-brain-gold.png`,
    },
    summary: {
      en: "Provide answers marked as accepted in discussions.",
      es: "Da respuestas que sean marcadas como aceptadas en las discusiones.",
    },
    howToGet: {
      en: ["Answer questions in GitHub Discussions and get your answer accepted."],
      es: ["Responde preguntas en GitHub Discussions y logra que acepten tu respuesta."],
    },
    tiers: [
      {
        tier: "bronze",
        label: "x2",
        emoji: "🥉",
        hex: "#F9BFA7",
        criterion: { en: "8 accepted answers.", es: "8 respuestas aceptadas." },
      },
      {
        tier: "silver",
        label: "x3",
        emoji: "🥈",
        hex: "#E1E4E4",
        criterion: { en: "16 accepted answers.", es: "16 respuestas aceptadas." },
      },
      {
        tier: "gold",
        label: "x4",
        emoji: "🥇",
        hex: "#FAE57E",
        criterion: { en: "32 accepted answers.", es: "32 respuestas aceptadas." },
      },
    ],
    references: [],
  },
  {
    slug: "pull-shark",
    title: { en: "Pull Shark", es: "Pull Shark" },
    category: "earnable",
    earnable: true,
    earnability: "earnable",
    badge: {
      default: `${BADGE_BASE}/pull-shark-default.png`,
      bronze: `${BADGE_BASE}/tiers/pull-shark-bronze.png`,
      silver: `${BADGE_BASE}/tiers/pull-shark-silver.png`,
      gold: `${BADGE_BASE}/tiers/pull-shark-gold.png`,
    },
    summary: {
      en: "Get pull requests merged.",
      es: "Consigue que fusionen tus pull requests.",
    },
    howToGet: {
      en: ["Open pull requests that get merged."],
      es: ["Abre pull requests que sean fusionados."],
    },
    tiers: [
      {
        tier: "bronze",
        label: "x2",
        emoji: "🥉",
        hex: "#F9BFA7",
        criterion: { en: "16 pull requests merged.", es: "16 pull requests fusionados." },
      },
      {
        tier: "silver",
        label: "x3",
        emoji: "🥈",
        hex: "#E1E4E4",
        criterion: { en: "128 pull requests merged.", es: "128 pull requests fusionados." },
      },
      {
        tier: "gold",
        label: "x4",
        emoji: "🥇",
        hex: "#FAE57E",
        criterion: { en: "1024 pull requests merged.", es: "1024 pull requests fusionados." },
      },
    ],
    references: [],
  },
  {
    slug: "yolo",
    title: { en: "YOLO", es: "YOLO" },
    category: "earnable",
    earnable: true,
    earnability: "earnable",
    badge: {
      default: `${BADGE_BASE}/yolo-default.png`,
    },
    summary: {
      en: "Merge your own pull request without a code review.",
      es: "Fusiona tu propio pull request sin revisión de código.",
    },
    howToGet: {
      en: ["Merge one of your own pull requests without any code review required."],
      es: ["Fusiona uno de tus propios pull requests sin requerir revisión de código."],
    },
    tiers: [],
    references: [],
  },
  {
    slug: "public-sponsor",
    title: { en: "Public Sponsor", es: "Public Sponsor" },
    category: "earnable",
    earnable: true,
    earnability: "earnable",
    badge: {
      default: `${BADGE_BASE}/public-sponsor-default.png`,
    },
    summary: {
      en: "Sponsor open source work via GitHub Sponsors.",
      es: "Patrocina trabajo open source a través de GitHub Sponsors.",
    },
    howToGet: {
      en: ["Sponsor an open source project through GitHub Sponsors while visible publicly."],
      es: ["Patrocina un proyecto open source mediante GitHub Sponsors de forma pública."],
    },
    tiers: [],
    references: [
      {
        label: { en: "GitHub Sponsors", es: "GitHub Sponsors" },
        url: "https://github.com/sponsors",
      },
    ],
    previousNames: [{ en: "GitHub Sponsor", es: "GitHub Sponsor" }],
  },
  {
    slug: "arctic-code-vault-contributor",
    title: { en: "Arctic Code Vault Contributor", es: "Arctic Code Vault Contributor" },
    category: "obsolete",
    earnable: false,
    earnability: "not-earnable",
    badge: {
      default: `${BADGE_BASE}/arctic-code-vault-contributor-default.png`,
    },
    summary: {
      en: "Contributed code to repositories in the 2020 GitHub Archive Program.",
      es: "Contribuiste código a repositorios del Programa de Archivo de GitHub 2020.",
    },
    howToGet: {
      en: [
        "This achievement is no longer earnable. It was awarded to contributors whose code was archived in the Arctic Code Vault as part of the 2020 GitHub Archive Program.",
      ],
      es: [
        "Este logro ya no se puede conseguir. Se otorgó a colaboradores cuyo código fue archivado en el Arctic Code Vault como parte del Programa de Archivo de GitHub 2020.",
      ],
    },
    tiers: [],
    references: [
      {
        label: { en: "Arctic Code Vault", es: "Arctic Code Vault" },
        url: "https://archiveprogram.github.com/",
      },
    ],
  },
  {
    slug: "mars-2020-contributor",
    title: { en: "Mars 2020 Contributor", es: "Mars 2020 Contributor" },
    category: "obsolete",
    earnable: false,
    earnability: "not-earnable",
    badge: {
      default: `${BADGE_BASE}/mars-2020-contributor-default.png`,
    },
    summary: {
      en: "Contributed code to repositories used in the Mars 2020 Helicopter Mission.",
      es: "Contribuiste código a repositorios usados en la misión del helicóptero Mars 2020.",
    },
    howToGet: {
      en: [
        "This achievement is no longer earnable. It was awarded to contributors whose code was used in the Mars 2020 Helicopter Mission.",
      ],
      es: [
        "Este logro ya no se puede conseguir. Se otorgó a colaboradores cuyo código se usó en la misión del helicóptero Mars 2020.",
      ],
    },
    tiers: [],
    references: [
      {
        label: { en: "NASA Ingenuity Helicopter", es: "Helicóptero Ingenuity de la NASA" },
        url: "https://github.com/readme/nasa-ingenuity-helicopter",
      },
    ],
    previousNames: [
      { en: "Mars 2020 Helicopter Contributor", es: "Mars 2020 Helicopter Contributor" },
    ],
  },
  {
    slug: "proxima-pioneer",
    title: { en: "Proxima Pioneer", es: "Proxima Pioneer" },
    category: "internal",
    earnable: false,
    earnability: "internal",
    badge: {
      default: `${BADGE_BASE}/proxima-pioneer-default-51cd4e4969d5.png`,
    },
    summary: {
      en: "Internal badge for GitHub staff who contributed to the Proxima POC.",
      es: "Insignia interna para personal de GitHub que contribuyó al Proxima POC.",
    },
    howToGet: {
      en: [
        "Internal achievement awarded to GitHub staff (M0 participant, contributed to Proxima POC). Cannot be earned through typical activity.",
      ],
      es: [
        "Logro interno otorgado al personal de GitHub (participante M0, contribuyó al Proxima POC). No se puede conseguir con actividad normal.",
      ],
    },
    tiers: [],
    references: [],
  },
  {
    slug: "proxima-staffshipper",
    title: { en: "Proxima Staffshipper", es: "Proxima Staffshipper" },
    category: "internal",
    earnable: false,
    earnability: "internal",
    badge: {
      default: `${BADGE_BASE}/proxima-staffshipper-default-84f658288021.png`,
    },
    summary: {
      en: "Internal badge for GitHub staff who shipped a Proxima Staffship instance.",
      es: "Insignia interna para personal de GitHub que desplegó una instancia de Proxima Staffship.",
    },
    howToGet: {
      en: [
        "Internal achievement awarded to GitHub staff (M8 participant, shipped Proxima Staffship instance). Cannot be earned through typical activity.",
      ],
      es: [
        "Logro interno otorgado al personal de GitHub (participante M8, desplegó una instancia de Proxima Staffship). No se puede conseguir con actividad normal.",
      ],
    },
    tiers: [],
    references: [],
  },
  {
    slug: "proxima-staffuser",
    title: { en: "Proxima Staffuser", es: "Proxima Staffuser" },
    category: "internal",
    earnable: false,
    earnability: "internal",
    badge: {
      default: `${BADGE_BASE}/proxima-staffuser-default-02bf6163ea31.png`,
    },
    summary: {
      en: "Internal badge for GitHub staff whose team is on Proxima.",
      es: "Insignia interna para personal de GitHub cuyo equipo está en Proxima.",
    },
    howToGet: {
      en: [
        "Internal achievement awarded to GitHub staff onboarded to Proxima. Cannot be earned through typical activity.",
      ],
      es: [
        "Logro interno otorgado al personal de GitHub incorporado a Proxima. No se puede conseguir con actividad normal.",
      ],
    },
    tiers: [],
    references: [],
  },
  {
    slug: "heart-on-your-sleeve",
    title: { en: "Heart On Your Sleeve", es: "Heart On Your Sleeve" },
    category: "disabled",
    earnable: false,
    earnability: "being-tested",
    badge: {
      default: `${BADGE_BASE}/heart-on-your-sleeve-default.png`,
      bronze: `${BADGE_BASE}/tiers/heart-on-your-sleeve-bronze.png`,
      silver: `${BADGE_BASE}/tiers/heart-on-your-sleeve-silver.png`,
      gold: `${BADGE_BASE}/tiers/heart-on-your-sleeve-gold.png`,
    },
    summary: {
      en: "React to something on GitHub with a heart emoji (disabled, being tested).",
      es: "Reacciona a algo en GitHub con un emoji de corazón (deshabilitado, en pruebas).",
    },
    howToGet: {
      en: ["This achievement is currently disabled and only being tested. It is not earnable."],
      es: ["Este logro está deshabilitado y solo en pruebas. No se puede conseguir."],
    },
    tiers: [
      {
        tier: "bronze",
        label: "x2",
        emoji: "🥉",
        hex: "#F9BFA7",
        criterion: { en: "16 ❤️ reactions.", es: "16 reacciones de corazón." },
      },
      {
        tier: "silver",
        label: "x3",
        emoji: "🥈",
        hex: "#E1E4E4",
        criterion: { en: "128 ❤️ reactions.", es: "128 reacciones de corazón." },
      },
      {
        tier: "gold",
        label: "x4",
        emoji: "🥇",
        hex: "#FAE57E",
        criterion: {
          en: "??? ❤️ reactions.",
          es: "Número desconocido de reacciones de corazón.",
        },
      },
    ],
    references: [],
  },
  {
    slug: "open-sourcerer",
    title: { en: "Open Sourcerer", es: "Open Sourcerer" },
    category: "disabled",
    earnable: false,
    earnability: "being-tested",
    badge: {
      default: `${BADGE_BASE}/open-sourcerer-default.png`,
      bronze: `${BADGE_BASE}/tiers/open-sourcerer-bronze.png`,
      silver: `${BADGE_BASE}/tiers/open-sourcerer-silver.png`,
      gold: `${BADGE_BASE}/tiers/open-sourcerer-gold.png`,
    },
    summary: {
      en: "Have pull requests merged in multiple public repositories (disabled, being tested).",
      es: "Consigue fusionar pull requests en varios repositorios públicos (deshabilitado, en pruebas).",
    },
    howToGet: {
      en: ["This achievement is currently disabled and only being tested. It is not earnable."],
      es: ["Este logro está deshabilitado y solo en pruebas. No se puede conseguir."],
    },
    tiers: [
      {
        tier: "bronze",
        label: "x2",
        emoji: "🥉",
        hex: "#F9BFA7",
        criterion: {
          en: "8 open source pull request merged.",
          es: "8 pull requests open source fusionados.",
        },
      },
      {
        tier: "silver",
        label: "x3",
        emoji: "🥈",
        hex: "#E1E4E4",
        criterion: {
          en: "16 open source pull request merged.",
          es: "16 pull requests open source fusionados.",
        },
      },
      {
        tier: "gold",
        label: "x4",
        emoji: "🥇",
        hex: "#FAE57E",
        criterion: {
          en: "64 open source pull request merged.",
          es: "64 pull requests open source fusionados.",
        },
      },
    ],
    references: [],
  },
];
