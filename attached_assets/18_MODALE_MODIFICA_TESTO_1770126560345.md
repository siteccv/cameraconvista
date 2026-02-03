# 18 – Modale “Modifica testo” (modello unico e riusabile)

Questa scheda è il **DNA** del modale di editing testi. Va seguita alla lettera ogni volta che il modale viene applicato a un nuovo testo. Non devono essere apportate altre modifiche al layout o al codice della pagina oltre a quelle strettamente necessarie all’inserimento del modale.

## Priorità 0 – Invarianze e divieti
- **Nessun altro cambiamento**: non alterare spacing, font, linee decorative, immagini, placeholder, cursor styling del sito al di fuori del perimetro del modale.
- **App sempre attiva**: lavorare con l’app in esecuzione su `http://localhost:5001` (route admin: `/admina/...`).
- **Valori originari immutabili**: il valore font “originario” di ciascun testo è quello attuale nel progetto e resta il riferimento permanente (usato dal reset). Cambiarlo solo su esplicita richiesta.

### Regola di ferro: NO seed / NO nuovi page_block senza conferma esplicita
- Se il testo target **NON** è già collegato a un `page_block` canonico, è **VIETATO**:
  - creare nuovi seed,
  - creare nuovi `page_block`,
  - toccare `server/storage/seeds/**`,
  - cambiare tipi o schema per “far compilare”.
- In questo caso l’unica modalità consentita è:
  - **MD18 = UI-ONLY (runtime)**.

## Priorità 1 – Funzionalità base
- **Campi**: IT ed EN (label configurabili). In desktop entrambi editabili; in mobile i contenuti restano in sola lettura (vedi Priorità 2).
- **Traduzione automatica**: pulsante accanto al campo EN, chiama `POST /api/translate { text, sourceLang: "it", targetLang: "en" }`. Fallback chain: DeepL → OpenAI → MyMemory → echo IT. Dopo la traduzione, applicare il casing dell’IT (upper/lower/title/sentence).
- **Casing**: maiuscole/minuscole del testo IT devono essere replicate nel risultato EN.
- **Allineamento e multilinea**: mantenere `text-align` coerente con il testo sul sito (es. center). Usare `whitespace-pre-line`/formattazione in ingresso per rispettare a capo e punteggiatura.
- **Accessibilità**: `DialogTitle` e `DialogDescription` con `aria-describedby` collegato; nessun warning ARIA ammesso.

## Priorità 2 – Desktop vs Mobile
- **Desktop**: contenuti e font modificabili; salvataggio su Supabase.
- **Mobile**: si può modificare solo la **dimensione del testo**; i contenuti restano non editabili. Il font mobile è locale (vedi Priorità 3) e non deve mai sovrascrivere Supabase/desktop.

## Modalità MD18: CANONICO vs UI-ONLY

| Modalità | Quando usarla | Desktop | Mobile | Fonte testo | Note |
| --- | --- | --- | --- | --- | --- |
| **CANONICO (persistente)** | Solo se esiste già un `page_block` collegato al testo target | IT/EN + font; **salva** su Supabase via PATCH | Solo font locale (current/origin) | **UNA sola fonte: block** | Vietato mantenere duplicati hardcoded “di sicurezza” |
| **UI-ONLY (runtime)** | Default se **NON** esiste `page_block` | IT/EN + font nel modale; **nessuna persistenza** (si perde al refresh) | Solo font locale (current/origin) | **Hardcoded = baseline eterna** | Reset px desktop usa comunque origin eterno da codice |

**Se manca page_block, fermarsi e chiedere al proprietario del progetto se vuole migrare a CANONICO. Senza risposta, restare UI-ONLY.**

### Anti-fallback / anti-doppia fonte
- In modalità **CANONICO**: il testo deve provenire da **UNA** fonte (block). Vietati fallback hardcoded “che oscurano” il block.
- In modalità **UI-ONLY**: il testo resta hardcoded (baseline eterna). Il modale opera solo runtime.

## Priorità 3 – Controllo dimensione testo
- **Range**: valori consentiti 6–96 px.
- **UI**: pulsanti `−` e `+` ai lati di un campo valore compatto (nessuna freccia spinner).  
  - `−` decrementa di 1px (raggiunge il minimo).  
  - `+` incrementa di 1px (raggiunge il massimo).  
- **Reset px**: bottone con contorno e testo color bordeaux (come il pulsante Salva), bordo leggermente marcato. Ripristina il **valore originario** del blocco per il contesto corrente (desktop: valore Supabase; mobile: valore originario salvato localmente). Non torna all’ultimo valore salvato.
- **Persistenza**:  
  - Desktop: `title_font_size` / `body_font_size` su Supabase (`page_blocks`).  
  - Mobile: salvataggio in `localStorage` separato per titolo e corpo, chiave `ccv_<slot>_font_mobile_<blockId>`. Mai propagare al desktop/Supabase.
- **Applicazione immediata**: il font viene applicato inline dopo il salvataggio (desktop) o dopo l’aggiornamento locale (mobile).

## Priorità 4 – Trigger e cursori
- Nessun pulsante visibile. Il testo editabile mostra l’icona matita su hover (classe cursor/overlay dedicata) e il click apre il modale.

## Priorità 5 – API e schema dati
- Tabella Supabase `page_blocks`: colonne `title_it`, `title_en`, `body_it`, `body_en`, `title_font_size`, `body_font_size` (integer).
- Estensioni future: per altre entità aggiungere colonne analoghe prima di abilitare il modale.

## Priorità 6 – Pipeline di salvataggio
- **Titolo**: patch `/api/page-blocks/:id` con `title_it`, `title_en`, `title_font_size` (desktop). Mobile: aggiorna solo font in localStorage.
- **Corpo**: patch `/api/page-blocks/:id` con `body_it`, `body_en`, `body_font_size` (desktop). Mobile: solo font in localStorage.
- Invalida/refetch query React Query su `["page-blocks"]` (e `["page-blocks", pageId]` se presente).

## Priorità 7 – Requisiti UI/UX generali
- Modale max 96vw / 960px, h 90vh con scroll interno.
- Textarea auto‑rows (min 3, max 8) per mostrare l’intero testo su più righe.
- Layout coerente con il sito: stessa font-family, pesi, centering; nessun distacco visivo dal contesto.

## Check-list prima di chiudere una PR/commit
- [ ] App in esecuzione su `:5001`, nessun altro layout toccato.  
- [ ] Traduzione EN rispetta casing IT.  
- [ ] Range font 6–96, bottoni − / + operativi, spinner rimossi.  
- [ ] Reset px riporta al valore originario (desktop da Supabase, mobile da originario locale).  
- [ ] Ho verificato se esiste un `page_block` collegato al testo target.
- [ ] Se NON esiste: ho applicato MD18 in modalità UI-ONLY e NON ho toccato seed/schema.
- [ ] Se esiste: ho applicato MD18 in modalità CANONICO senza fallback hardcoded.
- [ ] Mobile: solo font editabile, contenuti read-only. Desktop: contenuti e font editabili.  
- [ ] Nessun warning ARIA/console sul dialog.  
- [ ] MD18 aggiornato se è cambiata qualunque regola del modale.

_Se una regola non può essere rispettata, fermarsi e aggiornare questo file prima di procedere._
