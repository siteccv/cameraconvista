// Inserisce nell'HTML della pagina il testo costruito dal server e il precaricamento
// della foto principale. Senza accesso al database: si testa da sola.
import { escapeHtml } from "./render";

export interface PageContent {
  html: string;
  heroImage?: string;
}

// Il testo resta trasparente per 3 secondi: se React parte prima (quasi sempre) non si
// vede mai; su connessioni lente o senza JavaScript diventa leggibile.
const SSR_STYLE =
  '<style id="ssr-content-style">#ssr-content{opacity:0;animation:ssr-reveal 0s linear 3s forwards;' +
  "max-width:46rem;margin:0 auto;padding:2.5rem 1.25rem 4rem;font-family:Montserrat,system-ui,sans-serif;" +
  "line-height:1.6;color:hsl(349 55% 28%)}#ssr-content h1,#ssr-content h2,#ssr-content h3{" +
  'font-family:"Playfair Display",Georgia,serif;font-weight:500;line-height:1.25;margin:1.5em 0 .5em}' +
  "#ssr-content ul{padding-left:1.1em}#ssr-content a{color:inherit}@keyframes ssr-reveal{to{opacity:1}}</style>";

export function injectPageContent(html: string, content: PageContent | null): string {
  if (!content || !html.includes('<div id="root"></div>')) return html;
  // La foto in cima e l'elemento piu grande della pagina: il browser la chiede subito,
  // invece di aspettare JavaScript e API (circa 3,5 s su un telefono lento).
  const preload = content.heroImage
    ? `<link rel="preload" as="image" href="${escapeHtml(content.heroImage)}" fetchpriority="high">`
    : "";
  return html
    .replace("</head>", `    ${SSR_STYLE}${preload}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${content.html}</div>`);
}
