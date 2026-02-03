# 08 – GOVERNANCE E REGOLE DI LAVORO

### Aggiornamento 2026-01-29
- Hero placeholders: sfondo/testo rimossi, immagini eager; niente flash su Menu, Carta dei Vini, Cocktail Bar, Eventi Privati, Contatti, Home.
- Admin: box hero/placeholder rimossi per Menu, Cocktail, Carta dei Vini, Eventi, Galleria; card contenuti Galleria disattivata.

### Aggiornamento 2026-02-02
- Regola di codice: mantenere i file sorgente <350 righe; estrarre helper/hook/componenti condivisi dove serve.
- Build health: `npm run lint` e `npm run check` devono restare verdi; evitare eslint-disable superflui.
- Refactor condivisi: hero e teaser ora riusano hook/componenti comuni (placeholder, font, modali, media admin).

## Stato attuale

- Il progetto SITE CCV è uno stack **Vite + React + Express + Drizzle**. Supabase è usato sia per la carta vini (lettura `site_wines_public`) sia come DB per i contenuti admin (es. `pages`, `page_blocks`).
- Esiste già una struttura di base per:
  - routing pubblico (IT/EN),
  - admin panel,
  - schema dati per contenuti (site_settings, pages, page_blocks, events, media, wines).
- Il repository Git locale è inizializzato; il remote `origin` è configurato ma il push verso GitHub fallisce con `Repository not found` finché il repository remoto non esiste o l’utente autenticato non ha accesso.
- La cartella `docs/` contiene file di documentazione architetturale numerati (01–08) che **devono essere mantenuti aggiornati**.

---

## Regole operative generali

1. **Documentazione come fonte di verità**
   - I file in `docs/` (01–08) sono il riferimento ufficiale per:
     - struttura progetto,
     - routing/pagine,
     - schema dati e Supabase,
     - API e storage,
     - admin panel,
     - SEO/analytics,
     - carta vini e sync,
     - governance e regole di lavoro.
   - Ogni modifica significativa a codice, schema, routing, flussi deve essere riflessa in questi file.

2. **Aggiornare subito la documentazione**
   - Dopo ogni step che cambia:
     - tabelle/schema Drizzle,
     - endpoint Express,
     - struttura o contenuti delle pagine,
     - comportamento dell’admin panel,
     - flussi SEO/analytics,
     - fonte dati della carta vini,
   - è obbligatorio aggiornare il file docs pertinente **nello stesso branch/PR**.

3. **Stack fisso salvo decisione esplicita**
   - Stack corrente: **Vite + React + Express + Drizzle**.
   - Non introdurre altri framework full‑stack (es. Next.js) senza una decisione progettuale esplicita e aggiornamento della documentazione.

4. **No redesign non richiesto**
   - Non cambiare layout, UX o struttura delle pagine se non espressamente richiesto.
   - Le modifiche estetiche devono essere deliberate, motivate e documentate (almeno in `01_STRUTTURA_PROGETTO.md` / `02_ROUTING_E_PAGINE.md`).

5. **Supabase e DB**
   - Finché non è configurato Supabase:
     - Gli errori di connessione DB sono considerati **fuori scope**.
     - Si lavora su `MemStorage` come se fosse un DB finto ma tipizzato.
   - Quando Supabase verrà collegato, aggiornare:
     - `03_SCHEMA_DATI_E_SUPABASE.md`.
     - `04_API_E_STORAGE.md`.
     - Eventuali note in altri file docs.

---

## Comportamento richiesto a Cascade

1. **One‑source of truth**
   - Usare sempre i file `docs/` come mappa del progetto.
   - In caso di discrepanza tra codice e docs, aggiornare i docs **dopo aver allineato il codice allo stato desiderato**.

2. **Aggiornare sempre i docs dopo modifiche**
   - Ogni volta che Cascade modifica:
     - schema Drizzle,
     - storage/adapter DB,
     - route Express,
     - struttura pagine React,
     - flussi admin,
     - SEO/analytics,
     - logica carta vini,
   - deve:
     - identificare quali file in `docs/` sono impattati,
     - aggiornarli nella stessa sessione.

3. **Trasparenza nelle risposte**
   - Nelle risposte in chat, indicare quando è stato aggiornato un file in `docs/`.
   - Riassumere “cosa è cambiato” (codice + documentazione) a fine step.

4. **Rispetto dei vincoli di progetto**
   - Non introdurre nuove dipendenze, cambi di stack o redesign senza richiesta esplicita.
   - Non modificare SEO avanzata o integrare analytics senza uno step dedicato.

---

## Divieto di modificare layout o UX senza conferma

- Qualsiasi modifica a:
  - disposizione sezioni,
  - struttura navigazione,
  - componenti principali dell’interfaccia (header, footer, layout, hero),
  - comportamento di base della UX,

  deve essere:

  1. Esplicitata in anticipo all’utente.
  2. Approvata.
  3. Documentata in `01_STRUTTURA_PROGETTO.md` e/o `02_ROUTING_E_PAGINE.md`.

- Piccole correzioni estetiche (es. fix minori di stile) sono ammesse solo se collegate a bug/leggibilità e devono comunque essere descritte nel report di fine step.

---

## One‑step‑at‑a‑time workflow

- Il progetto è gestito per **step chiari e limitati** (es. collegare admin al backend, SEO, PWA, ecc.).
- In ogni step:
  1. Viene definito un obiettivo preciso.
  2. Cascade lavora solo nel perimetro di quello step (es. niente SEO quando si lavora sul wiring admin).
  3. A fine step, Cascade produce un report sintetico + aggiorna i docs pertinenti.

- Non sono ammessi interventi “a pioggia” su parti non richieste del codice o layout.

---

## Regole Git e versionamento

- Branch principale: `main`.
- Remote previsto: `origin` → `https://github.com/siteccv/cameraconvista.git` (creazione/abilitazione del repo remoto ancora da completare).
- Comportamento atteso:
  - Commit piccoli, tematici e con messaggi chiari (es. `docs: ...`, `feat: ...`, `fix: ...`).
  - Evitare commit che mischiano codice applicativo e grandi refactor non richiesti.
  - Quando si aggiornano i docs, includerli nello stesso commit della modifica funzionale associata, se ha senso.

---

## Sintesi vincoli chiave

- **Aggiornare sempre i file `docs/`** quando cambia qualcosa di strutturale.
- **Non cambiare stack** senza richiesta.
- **Non cambiare layout/UX** senza conferma.
- **Non gestire i vini dall’admin**: la carta vini è read‑only dal sito/admin.
- **Lavorare per step** ben delimitati, con report finale.
