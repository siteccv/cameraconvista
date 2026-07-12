# 07 - Analisi SEO (fotografia + piano)

> Foto scattata il **2026-07-12** su dati Google Search Console (12 mesi) e Google Analytics (28 giorni).
> I numeri sono una fotografia nel tempo: vanno riletti, non presi come stato attuale permanente.
> La parte tecnica SEO (come funziona) resta in `06_SEO.md`; qui c'è la diagnosi dai dati e cosa migliorare.

## Stato di salute: SANO, in crescita

- Andamento 12 mesi: crescita costante da febbraio a luglio 2026.
- Posizione media generale ~5,6 (spesso prima pagina).
- Search Console (12 mesi): ~5.700 clic / ~110k impressioni.
- Analytics (28 giorni): ~4,8k utenti, ~7,8k sessioni.

## Punti di forza (NON toccare, funzionano)

Ricerche "di marca" (chi cerca il nome del locale): dominio assoluto.

| Query | Posizione | CTR |
|---|---|---|
| camera con vista bologna | 1,09 | 25% |
| camera con vista colli | 1,39 | 23% |
| camera con vista bistrot | 1,73 | 24% |
| ristorante camera con vista bologna | 1,07 | 36% |

Pagina Colli menu: CTR **14,8%** (ottimo). La home prende il grosso del traffico
(~4.000 clic / ~105k impressioni).

## Traffico per pagina (12 mesi)

| Pagina | Clic | Impressioni | CTR |
|---|---|---|---|
| / (home) | 4.082 | 105.667 | 3,86% |
| /colli/menu | 852 | 5.747 | 14,83% |
| /menu | 788 | 21.084 | 3,74% |
| /cocktail-bar | 78 | 12.243 | 0,64% |
| /dove-siamo | 46 | 9.323 | 0,49% |
| /eventi-privati | 30 | 5.624 | 0,53% |

## Dispositivi

Mobile domina: 4.269 clic (pos. 4,32) vs Computer 1.435 (pos. 10). Il mobile va
prioritizzato. Il desktop è più debole in posizione ma converte meglio in CTR.

## Il vero margine di crescita: ricerche GENERICHE ad alto volume

Appare tanto ma pochi clic — qui c'è il potenziale non sfruttato:

| Query | Impressioni | Posizione | CTR | Clic |
|---|---|---|---|---|
| aperitivo bologna | 2.843 | 4,33 | 0,49% | 14 |
| cocktail bar bologna | 1.232 | 7,62 | 0,97% | 12 |
| aperitivo bologna centro | 1.084 | 4,64 | 0,65% | 7 |
| bar (generico) | 701 | 12,6 | — | 2 |
| rooftop bologna | 511 | 5,46 | 0,20% | 1 |
| best restaurants with view | 584 | 12,3 | 0% | 0 |

Migliaia di impressioni su ricerche calde (aperitivo/cocktail/rooftop/vista) che
NON diventano clic: Google ci mostra, ma l'utente clicca il concorrente col titolo
più pertinente.

## Ipotesi tecnica (da validare, non ancora applicata)

I title/description sono in `server/seo.ts` (default per slug) e sovrascrivibili
da admin (`page.metaTitleIt/En`). Il title home attuale:
"Camera con Vista - Tapas Bar e Cocktail Bar Bologna".

Ipotesi: mancano parole chiave molto cercate — **aperitivo**, **con vista/rooftop**,
**santo stefano** — nei title/description delle pagine ad alta impressione (home,
cocktail-bar, dove-siamo). Chi cerca "aperitivo bologna" non vede "aperitivo" nel
nostro titolo e clicca altro.

## Piano di miglioramento (a step, sicuro, solo testo)

Tutte modifiche a SOLI meta tag (title/description): zero rischio dati/layout,
cambiano solo cosa legge Google. Da fare una alla volta, con conferma.

1. **Home** — inserire "aperitivo" e "con vista/rooftop" nel title/description.
2. **cocktail-bar** — title più forte su "cocktail bar bologna" (12k impressioni, CTR 0,64%).
3. **dove-siamo** — sfruttare "santo stefano" / "piazza santo stefano" (ricerche locali frequenti).
4. **menu** — 21k impressioni, CTR 3,74%: ritoccare per alzare i clic.

NB: verificare sempre se l'admin ha già un meta personalizzato per la pagina
(`page.metaTitleIt`) prima di cambiare il default nel codice: se c'è, vince quello.

## Da capire ancora (aperto)

- Durata media sessione ~28s (Analytics): capire se è normale per sito-vetrina di
  locale o segnale di problema. Serve il report "Pagine e schermate" di GA4.
