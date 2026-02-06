export const HOME_PAGE_ID = 1;

export const DEFAULT_BLOCKS = {
  hero: {
    blockType: "hero",
    sortOrder: 0,
    titleIt: "Camera con Vista",
    titleEn: "Camera con Vista",
    bodyIt: "Ristorante & Cocktail Bar",
    bodyEn: "Restaurant & Cocktail Bar",
    imageUrl: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    imageScaleDesktop: 100,
    imageScaleMobile: 100,
    imageOffsetX: 0,
    imageOffsetY: 0,
    imageOffsetXMobile: 0,
    imageOffsetYMobile: 0,
    titleFontSize: 72,
    titleFontSizeMobile: 40,
    bodyFontSize: 28,
    bodyFontSizeMobile: 20,
    isDraft: false,
  },
  branding: {
    blockType: "branding",
    sortOrder: 2,
    titleIt: "RESTAURANT & COCKTAIL BAR",
    titleEn: "RESTAURANT & COCKTAIL BAR",
    bodyIt: "French nuance, antique goods",
    bodyEn: "French nuance, antique goods",
    titleFontSize: 15,
    titleFontSizeMobile: 11,
    bodyFontSize: 26,
    bodyFontSizeMobile: 18,
    isDraft: false,
  },
};

export interface TeaserBlockDefault {
  blockType: string;
  sortOrder: number;
  titleIt: string;
  titleEn: string;
  bodyIt: string;
  bodyEn: string;
  ctaTextIt: string;
  ctaTextEn: string;
  ctaUrl: string;
  imageUrl: string;
  imageScaleDesktop: number;
  imageScaleMobile: number;
  imageOffsetX: number;
  imageOffsetY: number;
  imageOffsetXMobile: number;
  imageOffsetYMobile: number;
  titleFontSize: number;
  titleFontSizeMobile: number;
  bodyFontSize: number;
  bodyFontSizeMobile: number;
  isDraft: boolean;
  metadata: {
    subtitleIt: string;
    subtitleEn: string;
    testId: string;
  };
}

export const TEASER_BLOCK_DEFAULTS: TeaserBlockDefault[] = [
  {
    blockType: "teaser-menu",
    sortOrder: 10,
    titleIt: "Il nostro Menù",
    titleEn: "Our Menu",
    bodyIt: "La nostra cucina celebra i sapori autentici della tradizione italiana, reinterpretati con creatività e ingredienti di stagione. Ogni piatto è un viaggio sensoriale tra gusto e raffinatezza.",
    bodyEn: "Our cuisine celebrates the authentic flavors of Italian tradition, reinterpreted with creativity and seasonal ingredients. Each dish is a sensory journey between taste and refinement.",
    ctaTextIt: "Scopri il menù",
    ctaTextEn: "Discover the menu",
    ctaUrl: "/menu",
    imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    imageScaleDesktop: 100,
    imageScaleMobile: 100,
    imageOffsetX: 0,
    imageOffsetY: 0,
    imageOffsetXMobile: 0,
    imageOffsetYMobile: 0,
    titleFontSize: 48,
    titleFontSizeMobile: 30,
    bodyFontSize: 18,
    bodyFontSizeMobile: 14,
    isDraft: false,
    metadata: { subtitleIt: "Ristorante", subtitleEn: "Restaurant", testId: "teaser-menu" },
  },
  {
    blockType: "teaser-vini",
    sortOrder: 11,
    titleIt: "I nostri Vini",
    titleEn: "Our Wines",
    bodyIt: "Una selezione curata di etichette italiane e internazionali, scelte per accompagnare ogni momento della vostra esperienza. Dal calice alla bottiglia, ogni vino racconta il suo territorio.",
    bodyEn: "A curated selection of Italian and international labels, chosen to accompany every moment of your experience. From the glass to the bottle, each wine tells the story of its territory.",
    ctaTextIt: "Esplora la carta",
    ctaTextEn: "Explore the list",
    ctaUrl: "/lista-vini",
    imageUrl: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    imageScaleDesktop: 100,
    imageScaleMobile: 100,
    imageOffsetX: 0,
    imageOffsetY: 0,
    imageOffsetXMobile: 0,
    imageOffsetYMobile: 0,
    titleFontSize: 48,
    titleFontSizeMobile: 30,
    bodyFontSize: 18,
    bodyFontSizeMobile: 14,
    isDraft: false,
    metadata: { subtitleIt: "Carta dei Vini", subtitleEn: "Wine List", testId: "teaser-vini" },
  },
  {
    blockType: "teaser-cocktail",
    sortOrder: 12,
    titleIt: "I nostri Cocktail",
    titleEn: "Our Cocktails",
    bodyIt: "Cocktail creativi preparati con ingredienti di prima qualità dai nostri mixologist. Ogni creazione è pensata per sorprendere e deliziare, rispettando la tradizione mentre esplora nuovi orizzonti del gusto.",
    bodyEn: "Creative cocktails crafted with premium ingredients by our mixologists. Each creation is designed to surprise and delight, respecting tradition while exploring new horizons of taste.",
    ctaTextIt: "Scopri i cocktail",
    ctaTextEn: "Discover cocktails",
    ctaUrl: "/cocktail-bar",
    imageUrl: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    imageScaleDesktop: 100,
    imageScaleMobile: 100,
    imageOffsetX: 0,
    imageOffsetY: 0,
    imageOffsetXMobile: 0,
    imageOffsetYMobile: 0,
    titleFontSize: 48,
    titleFontSizeMobile: 30,
    bodyFontSize: 18,
    bodyFontSizeMobile: 14,
    isDraft: false,
    metadata: { subtitleIt: "Cocktail Bar", subtitleEn: "Cocktail Bar", testId: "teaser-cocktail" },
  },
  {
    blockType: "teaser-eventi",
    sortOrder: 13,
    titleIt: "I nostri Eventi",
    titleEn: "Our Events",
    bodyIt: "Serate a tema, degustazioni, musica dal vivo e molto altro. Scopri il calendario degli eventi e vivi esperienze indimenticabili in un'atmosfera unica.",
    bodyEn: "Themed nights, tastings, live music and much more. Discover our events calendar and enjoy unforgettable experiences in a unique atmosphere.",
    ctaTextIt: "Vedi gli eventi",
    ctaTextEn: "See events",
    ctaUrl: "/eventi",
    imageUrl: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    imageScaleDesktop: 100,
    imageScaleMobile: 100,
    imageOffsetX: 0,
    imageOffsetY: 0,
    imageOffsetXMobile: 0,
    imageOffsetYMobile: 0,
    titleFontSize: 48,
    titleFontSizeMobile: 30,
    bodyFontSize: 18,
    bodyFontSizeMobile: 14,
    isDraft: false,
    metadata: { subtitleIt: "Eventi", subtitleEn: "Events", testId: "teaser-eventi" },
  },
  {
    blockType: "teaser-privati",
    sortOrder: 14,
    titleIt: "Crea il tuo Evento",
    titleEn: "Create your Event",
    bodyIt: "Camera con Vista offre spazi esclusivi e servizi personalizzati per rendere ogni occasione indimenticabile. Dal party aziendale alla celebrazione privata, ogni dettaglio è curato con la massima attenzione.",
    bodyEn: "Camera con Vista offers exclusive spaces and personalized services to make every occasion unforgettable. From corporate parties to private celebrations, every detail is curated with the utmost attention.",
    ctaTextIt: "Crea il tuo evento",
    ctaTextEn: "Create your event",
    ctaUrl: "/eventi-privati",
    imageUrl: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    imageScaleDesktop: 100,
    imageScaleMobile: 100,
    imageOffsetX: 0,
    imageOffsetY: 0,
    imageOffsetXMobile: 0,
    imageOffsetYMobile: 0,
    titleFontSize: 48,
    titleFontSizeMobile: 30,
    bodyFontSize: 18,
    bodyFontSizeMobile: 14,
    isDraft: false,
    metadata: { subtitleIt: "Eventi Privati", subtitleEn: "Private Events", testId: "teaser-privati" },
  },
];

export const TEASER_BLOCK_TYPES = TEASER_BLOCK_DEFAULTS.map(d => d.blockType);
