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

| Query                               | Posizione | CTR |
| ----------------------------------- | --------- | --- |
| camera con vista bologna            | 1,09      | 25% |
| camera con vista colli              | 1,39      | 23% |
| camera con vista bistrot            | 1,73      | 24% |
| ristorante camera con vista bologna | 1,07      | 36% |

Pagina Colli menu: CTR **14,8%** (ottimo). La home prende il grosso del traffico
(~4.000 clic / ~105k impressioni).

## Traffico per pagina (12 mesi)

| Pagina          | Clic  | Impressioni | CTR    |
| --------------- | ----- | ----------- | ------ |
| / (home)        | 4.082 | 105.667     | 3,86%  |
| /colli/menu     | 852   | 5.747       | 14,83% |
| /menu           | 788   | 21.084      | 3,74%  |
| /cocktail-bar   | 78    | 12.243      | 0,64%  |
| /dove-siamo     | 46    | 9.323       | 0,49%  |
| /eventi-privati | 30    | 5.624       | 0,53%  |

## Dispositivi

Mobile domina: 4.269 clic (pos. 4,32) vs Computer 1.435 (pos. 10). Il mobile va
prioritizzato. Il desktop è più debole in posizione ma converte meglio in CTR.

## Il vero margine di crescita: ricerche GENERICHE ad alto volume

Appare tanto ma pochi clic — qui c'è il potenziale non sfruttato:

| Query                      | Impressioni | Posizione | CTR   | Clic |
| -------------------------- | ----------- | --------- | ----- | ---- |
| aperitivo bologna          | 2.843       | 4,33      | 0,49% | 14   |
| cocktail bar bologna       | 1.232       | 7,62      | 0,97% | 12   |
| aperitivo bologna centro   | 1.084       | 4,64      | 0,65% | 7    |
| bar (generico)             | 701         | 12,6      | —     | 2    |
| rooftop bologna            | 511         | 5,46      | 0,20% | 1    |
| best restaurants with view | 584         | 12,3      | 0%    | 0    |

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

## Piano ATTUATO il 15/09/2026 (owner-approved, sessione autonoma)

Tutti i 4 step del piano (+ altri) sono stati implementati scrivendo i meta nel **DB**
(`pages.meta_title_*`/`meta_description_*` — che vince sui default del codice), IT+EN,
verificati subito sull'HTML live. Pagine toccate: home, menu, cocktail-bar, dove-siamo,
carta-vini, eventi-privati, eventi-privati-cena (prima senza meta né slug), colli.
Valori precedenti in `~/Documents/SITE-CCV-ARCHIVIO/pages-meta-backup-20260916.json`. Lasciate invariate perché
già buone o vincenti: colli-menu (CTR 14,8% — non toccare), eventi, galleria,
eventi-privati-aperitivo/esclusivo. La parola **"rooftop" NON è stata usata** (non
verificabile che il locale sia un rooftop: chiedere all'owner prima di usarla).
Contestualmente (stesso giorno, via push): fix soft-404 e JSON-LD LocalBusiness per
`/colli`. **Ricontrollare CTR in GSC tra 2-4 settimane** sulla proprietà Dominio
(`sc-domain:cameraconvista.it`).

**Aggiornamento 15/09 pomeriggio — backfill Dominio arrivato.** Scoperta chiave (giu-set 2026):
posizione 1,3-1,9 su "ristorante con terrazza bologna" (55 impr), "aperitivo (in) terrazza
bologna" (66 impr) con **0-1 clic**: la parola non compariva nei testi. Owner: NON siamo rooftop
(parola vietata), abbiamo un dehors = tavoli in strada; "terrazza" VIETATA anche in IT, e
"terrace" rimossa anche in EN (sostituita con "outdoor tables"). "dehors" non viene cercato (0 query).

**Aggiornamento 15/09 sera — schema "tre momenti" ATTUATO (owner-approved).** Il locale è
aperto 17.30–01.00 (cucina 18.00–22.30) con tre momenti: aperitivo, cena, dopocena. Dati:
bucket CENA = miglior CTR (2,6-2,9% su ~3.750 impr) mai coperto dai testi; DOPOCENA quasi
invisibile ("dopocena bologna"/"dove bere la sera": mai comparsi; "dove bere a bologna" pos 4,1).
Fatto nel DB (meta + `published_snapshot` dei blocchi): description home/menu/dove-siamo/
eventi-privati, title+description menu e cocktail-bar ("Drink fino all'1"), intro cocktail-bar
e eventi-privati (formule reali: tavolo conviviale, Jazz Club, ~80 ospiti max, risposta entro
2 giorni), EN "outdoor terrace"→"dehors". Nel codice: CTA preventivo renderizzata in fondo a
`/eventi-privati`. Card Cena e Party: SPENTE per scelta owner; pagina cena nascosta (noindex).
Focus invariati: bistrot + cocktail bar famoso; aperitivo non toccato dove vince.
Stima: +200-350 clic/anno. Ricontrollo CTR in GSC tra 2-4 settimane.

## Da capire ancora (aperto)

- Durata media sessione ~28s (Analytics): capire se è normale per sito-vetrina di
  locale o segnale di problema. Serve il report "Pagine e schermate" di GA4.

## Analisi 17/09/2026 — perche' non usciamo sulle ricerche generiche

Dati Search Console 17/06-16/09/2026: 2393 clic, 38767 impressioni, posizione media 5,4.
**Il 94% dei clic arriva da chi cerca gia' il nome** (1689 clic brand contro 100 clic su 475 query generiche): chi ci conosce ci trova, chi non ci conosce quasi mai.

Impressioni per tema: aperitivo 3878 (pos. 6,6) · terrazza/vista 950 (6,2) · cocktail bar 764 (6,5) · ristorante/cena 685 (5,6) · bistrot 37 (12,1) · vini 4 (14,2) · dopocena ed eventi privati 0.

Cause in ordine di impatto:

1. **Sulle ricerche generiche di categoria Google mostra la mappa, non i siti.** La leva e' la scheda Google Business, non il codice. Confronto verificato con Guero (sempre nei primi risultati su "cocktail bar bologna"): 170 parole servite, 3 heading, **nessuna** meta description, **nessun** dato strutturato — un sito piu' debole del nostro. Non vince col sito.
2. **La home servita a Googlebot contiene 11 parole** (`<div id="root"></div>`, zero heading). Meta, canonical, hreflang e JSON-LD ci sono, il corpo no: Google deve fare un secondo passaggio di rendering. Frena tutte le ricerche a testo.
3. **Home e `/cocktail-bar` competono sulla stessa query.** Su "cocktail bar bologna" la home e' in 6,6 e `/cocktail-bar` in 10,7: Google non sceglie e non spinge nessuna delle due.
4. **Tempo di risposta** 0,20-0,50s contro 0,06-0,15s di Guero (piano free Render).
5. Temi scoperti: bistrot, vini, dopocena, eventi privati.
6. `openingHoursSpecification` assente dal JSON-LD.

**Ipotesi smentita:** non ci sono URL indicizzati rotti. Controllo URL Inspection su `/`, `/dove-siamo`, `/menu`: tutte "Submitted and indexed", `pageFetchState: SUCCESSFUL`.

### Interventi fatti il 17/09/2026

**Scheda Google Business** (leva 1): rimosso l'attributo "Prenotazione obbligatoria" (falso, si entra anche senza prenotare); riscritta la descrizione mettendo cocktail bar e bistrot davanti all'aperitivo; categorie portate a "Locale specializzato in cocktail" (principale) + Tapas, Ristorante, Bistro'. Scartata "Enoteca": 55 etichette in carta non sono un'enoteca e sui vini ci sono 4 impressioni in 3 mesi. La fascia di prezzo (10-60 €, "segnalato da 159 persone") non e' modificabile dal pannello: la determinano le risposte dei clienti.

**Titolo home** (`pages.meta_title_it`): da "Aperitivo a Bologna in Centro con Vista" a **"Cocktail Bar e Aperitivo a Bologna - Camera con Vista"**. Tenuta "aperitivo" di proposito: e' la parola con cinque volte le impressioni di "cocktail bar", toglierla costerebbe.

**Fix 404 sull'header `Accept`** — vedi `06_SEO.md`. Era la causa del rifiuto della richiesta di indicizzazione su `/cocktail-bar` e molto probabilmente dei Soft 404 in massa.

Aggiunto `openingHoursSpecification` al JSON-LD della home, **derivato da `site_settings.footer_settings`** (`buildOpeningHoursSpecification()` in `server/seo.ts`) e non scritto a mano: se l'owner cambia gli orari dall'admin, cambiano anche i dati dati a Google. Oggi risulta 18:00-01:00 tutti i giorni. Il JSON-LD di Colli non e' toccato: e' un'altra sede con orari suoi.

**Incoerenza da chiarire:** il footer dice `18:00`, diverse meta description dicono "aperti dalle 17.30". Una delle due e' sbagliata. Non risolta il 17/09/2026 perche' l'orario vero va confermato dall'owner.

### Da fare nella prossima sessione (circa una settimana dopo il 17/09/2026)

L'ordine conta: le tre leve accese il 17/09 (scheda Google, titolo home, fix 404) hanno bisogno di settimane per produrre effetti. Aggiungere subito altro impedisce di capire cosa ha funzionato.

1. **Rileggere i Soft 404.** Erano 54 con convalida fallita, ma il rapporto Search Console guardato il 17/09 era fermo al 14/09 e il fix sull'header `Accept` e' arrivato dopo: molti potrebbero essere spariti da soli. L'elenco degli URL **non e' esposto dall'API**, va esportato a mano dal rapporto "Indicizzazione delle pagine".
2. **Misurare l'effetto.** Confrontare con la base del 17/06-16/09: 2393 clic, 38767 impressioni, posizione 5,4, 94% di clic brand. Guardare in particolare la posizione su "cocktail bar bologna" (era 6,6 per la home e 10,7 per `/cocktail-bar`) e le impressioni su bistrot (erano 37) dopo l'aggiunta delle categorie.
3. **Solo a quel punto decidere** se serve davvero far servire dal server il testo vero delle pagine (causa 2), partendo da `/cocktail-bar`, che risolverebbe anche la 3. Potrebbe non servire piu'.
4. Chiarire l'orario vero (17.30 o 18.00) e allineare footer e meta description.
