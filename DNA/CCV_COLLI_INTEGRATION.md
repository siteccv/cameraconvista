# CCV Colli Integration

## 1. Titolo

Scheda tecnica di lavoro per integrare il menu digitale Camera con Vista Colli dentro
`SITE-CCV`.

## 2. Stato del documento

- Stato: documento guida operativo e stato reale dell'integrazione.
- Data creazione: 2026-05-13.
- Fonte primaria: codice reale in `SITE-CCV`.
- Nota storica: `ccv-colli-source` e stata usata come riferimento tecnico/visuale durante l'integrazione, poi rimossa dalla workspace finale per mantenere il progetto pulito.
- Scopo: essere il riferimento vivo per tutte le fasi future dell'integrazione.
- Regola: ogni modifica futura relativa a Colli deve essere confrontata con questa scheda e, se cambia architettura, dati, rischi o workflow, la scheda va aggiornata.

Questa scheda documenta lo stato operativo reale dell'integrazione Colli. Ogni modifica futura deve continuare a essere confrontata con questa scheda, aggiornata qui e verificata con test.

### Stato consolidato al 2026-05-13

- `/colli`: vetrina pubblica integrata nel sito e gestibile da admin SITE-CCV.
- `/colli/menu`: menu digitale diretto per QR, separato dal layout pubblico standard.
- `/colli/admina`: admin Colli separato, accessibile da ingranaggio nel menu Colli.
- DB: dati Colli migrati in tabelle indipendenti `colli_*`.
- CMS: pagina `colli` pubblicata, visibile e senza blocchi in bozza.
- Menu Colli: 1 snapshot attivo in `colli_menu_snapshots`; snapshot precedenti archiviati.
- Render Colli: mantenuto solo come fallback/riferimento fino a verifica produzione.
- Cartella `ccv-colli-source`: rimossa dalla workspace finale; non e parte del runtime, della build o del deploy.
- Backup locali: consolidati in `BACKUP/` con solo archivio operativo finale e snapshot DB finale.
- Commit/push: non eseguiti in questa fase.

### Stato aggiornato al 2026-05-14

- il menu Colli puo essere incorporato esternamente solo in modo controllato;
- il server SITE-CCV autorizza l'embed del solo path `/colli/menu`;
- origin autorizzati: `https://www.cashin.coop` e `https://cashin.coop`;
- il resto del sito mantiene `X-Frame-Options: SAMEORIGIN`;
- nessuna apertura CORS aggiuntiva e stata introdotta per `/api/colli/menu`;
- CA'SHIN oggi incorpora ancora il vecchio Render `https://ccvcolli-ghxg.onrender.com/` e dovra aggiornare il `src` dell'iframe verso `https://www.cameraconvista.it/colli/menu` dopo deploy;
- la rotta `/colli/menu` e valida per browser reali; controlli grezzi senza `Accept: text/html` possono restituire `Cannot GET /colli/menu` per via del fallback SPA e non vanno usati come unica verifica funzionale dell'URL pubblico.
- il menu digitale `/colli/menu` ha di nuovo una intro splash iniziale stile progetto Colli originale, con logo centrato e fade in/out omogeneo;
- la splash dura `4.5s`, viene mostrata una sola volta per sessione browser e non ritarda inutilmente il fetch dei dati menu.

## 3. Obiettivo finale

La destinazione definitiva dei nuovi QR code deve essere:

```text
https://www.cameraconvista.it/colli/menu
```

Il cliente che scannerizza il QR deve arrivare direttamente al menu digitale Colli completo, equivalente all'esperienza attuale pubblicata su:

```text
https://ccvcolli-ghxg.onrender.com
```

La rotta `/colli/menu` deve essere il menu digitale diretto per QR.

La stessa rotta e ora anche l'URL canonico da usare per embed controllati esterni approvati, a partire da CA'SHIN.

La rotta `/colli` deve essere una pagina vetrina Colli con foto principale, piccola gallery e pulsante "Scopri il menu" verso `/colli/menu`.

## 4. Problema originale

Il vecchio servizio Render di CCV Colli e stato eliminato accidentalmente.

Vecchio URL Render:

```text
https://ccvcolli.onrender.com
```

I vecchi QR code stampati puntavano a quel link e non sono piu utilizzabili.

Per evitare di ripetere lo stesso problema, i nuovi QR code non devono piu puntare direttamente a Render. Devono puntare a un URL controllato dal dominio principale:

```text
https://www.cameraconvista.it/colli/menu
```

Il servizio Render temporaneo attuale deve restare attivo finche la nuova rotta `/colli/menu` non e verificata anche in produzione dopo deploy.

Dopo deploy del fix embed, Render puo restare fallback tecnico ma non deve piu essere usato come `iframe src` sul sito CA'SHIN.

### Memo diagnostico rapido per futuri problemi CA'SHIN

- un link normale verso `https://www.cameraconvista.it/colli/menu` non viene bloccato dalle policy iframe del sito;
- il problema gestito nel 2026-05-14 riguardava l'embed in `iframe`, non la navigazione diretta;
- il fix lato SITE-CCV riguarda solo la pagina HTML `/colli/menu`, non l'API `/api/colli/menu`;
- se CA'SHIN segnala ancora blocchi, controllare prima il `src` reale pubblicato nella loro pagina:
  - se e `https://www.cameraconvista.it/colli/menu`, verificare header live `frame-ancestors`;
  - se e ancora `https://ccvcolli-ghxg.onrender.com/`, il problema e nel loro aggiornamento del contenuto e non nella policy del dominio principale Camera con Vista.

## 5. Decisione strategica

Decisione consolidata:

```text
Conviene integrare parzialmente: ricostruire /colli e /colli/menu in SITE-CCV, mantenendo dati, logica e admin Colli separati e namespaced. Non conviene importare direttamente il progetto Expo.
```

Questa decisione implica:

- non importare direttamente il progetto Expo dentro `SITE-CCV`;
- non copiare `package.json` di Colli;
- non introdurre Expo Router, React Native Web o React 19 nel sito principale senza una decisione esplicita successiva;
- `ccv-colli-source` e stata usata solo come riferimento visuale, funzionale e dati durante l'integrazione;
- ricostruire `/colli` come vetrina Colli coerente con `SITE-CCV`;
- ricostruire `/colli/menu` come menu digitale Colli diretto, mobile-first e QR-first;
- mantenere dati Colli separati dai dati Camera con Vista;
- mantenere API e admin Colli namespaced.

## 6. Stato attuale SITE-CCV

Stack reale:

- React 18;
- TypeScript;
- Vite;
- Wouter;
- TanStack Query;
- Express 5;
- Drizzle;
- Supabase;
- SEO server-side.

Punti rilevati:

- frontend pubblico principale: `client/src/App.tsx`;
- backend API modulare: `server/routes/index.ts`;
- route pubbliche e admin: definite lato client in `App.tsx`;
- SEO server-side: `server/seo.ts`;
- build: `scripts/build.ts`;
- storage runtime: `server/storage.ts` e `server/supabase-storage.ts`;
- nel codice locale sono state aggiunte le rotte `/colli` e `/colli/menu`;
- online le rotte entreranno in vigore solo dopo push/deploy controllato;
- il menu Camera con Vista esistente e separato in tre flussi: menu, vini, cocktail;
- i dati Camera con Vista arrivano da Google Sheets;
- la sync scrive in tabelle operative;
- il pubblico legge snapshot JSON pubblicati in `site_settings`, non direttamente le tabelle live;
- l'admin principale `/admina` gestisce pagine, eventi, gallery, media, SEO, sync Google e impostazioni;
- l'autorizzazione attuale e sostanzialmente binaria: sessione admin si/no;
- `shared/schema.ts` contiene `users.role`, ma il runtime reale usa password admin in `site_settings` e cookie `ccv_admin_session`;
- non risultano permessi granulari per area, venue o sotto-admin.

File critici da considerare in fasi future:

- `client/src/App.tsx`;
- `client/src/components/layout/PublicLayout.tsx`;
- `client/src/components/layout/Header.tsx`;
- `client/src/components/layout/AdminLayout.tsx`;
- `server/routes/index.ts`;
- `server/routes/auth.ts`;
- `server/routes/helpers.ts`;
- `server/routes/menu.ts`;
- `server/routes/sync.ts`;
- `server/seo.ts`;
- `shared/schema.ts`;
- `server/storage.ts`;
- `server/supabase-storage.ts`.

## 7. Stato attuale CCV Colli

La cartella `ccv-colli-source` conteneva il progetto Colli di partenza ed e stata usata solo come riferimento durante l'integrazione.
Non fa parte del progetto funzionale finale ed e stata rimossa dalla workspace dopo il consolidamento.

Stack:

- Expo 54;
- React 19;
- React Native 0.81;
- React Native Web;
- Expo Router;
- Express;
- Supabase JS;
- TanStack Query.

Rotte principali rilevate:

- `/`: splash e lista sezioni;
- `/menu/[section]`: menu Food, Drinks, Vini;
- `/admina`: login admin;
- `/admina/panel`: pannello admin Colli;
- `/admin/*`: redirect legacy verso `/admina`.

Endpoint pubblico usato dal frontend:

```text
GET /api/menu/draft
```

Non esiste un vero flusso draft/publish: pubblico e admin leggono la stessa snapshot live.

Entita dati rilevate:

- `sections`;
- `categories`;
- `dishes`;
- `wine_categories`;
- `wines`;
- `allergens`.

Conteggi rilevati dal servizio online `https://ccvcolli-ghxg.onrender.com/api/menu/draft`:

- sezioni: 3;
- categorie: 14;
- prodotti: 120;
- categorie vino: 5;
- vini: 11;
- allergeni: 14.

Sezioni pubbliche:

- Food;
- Drinks;
- Vini.

### Freeze operativo 2026-05-13

Step 1 eseguito il 2026-05-13.

Servizio verificato:

- `https://ccvcolli-ghxg.onrender.com/api/health` risponde `200`;
- stato API: `ok`;
- Supabase Colli: `connected`.

Export dati creato in:

```text
BACKUP/colli_menu_freeze_2026-05-13_13-03-41.json
```

Nota: `BACKUP/` e esclusa da Git, quindi questo export e un backup locale operativo, non un file versionato.

Checksum file export:

```text
7491bb36ad7958569597dbad87d60fd1c7379b1b129147f5ccf1e7e4a1238bf8
```

Checksum raw JSON sorgente:

```text
4ec7fc6d8c9a8b1728646f0251a4c49d44d3e8630341c3fb7435a758b25b2380
```

Conteggi congelati:

- sezioni: 3;
- categorie: 14;
- prodotti: 120;
- categorie vino: 5;
- vini: 11;
- allergeni: 14.

Sezioni congelate:

- Food;
- Drinks;
- Vini.

Elementi visuali/funzionali da replicare:

- logo Camera con Vista Colli;
- stile beige/elegante;
- esperienza mobile-first;
- splash iniziale;
- lista sezioni Food, Drinks, Vini;
- navigazione hamburger nelle pagine interne;
- categorie;
- prodotti;
- prezzi;
- dettagli prodotto dove presenti;
- allergeni;
- vini con categorie e prezzi calice/bottiglia;
- footer o nota "in collaborazione con CA'SHIN".

## 8. Diagnosi compatibilita

Compatibilita visuale: buona.

Compatibilita dati: buona, ma richiede modello dedicato.

Compatibilita tecnica diretta: bassa.

Motivi:

- `SITE-CCV` usa React web 18 + Vite + Wouter;
- Colli usa Expo + React 19 + React Native Web + Expo Router;
- importare componenti Colli direttamente introdurrebbe dipendenze e runtime non coerenti;
- il routing Colli non e compatibile con il routing Wouter esistente;
- il modello dati Colli e gerarchico, mentre il menu CCV esistente usa tabelle flat e snapshot separati;
- l'admin Colli attuale non ha auth server-side robusta e non va copiato.

Conclusione: `ccv-colli-source` va trattato come riferimento, non come modulo da importare direttamente.

## 9. Strategia scelta

Strategia: integrazione parziale.

La futura `/colli` deve essere ricostruita in `SITE-CCV` usando lo stack esistente:

- React web;
- Vite;
- Wouter;
- TanStack Query;
- Express;
- Supabase/storage server-side esistente o adapter dedicato.

Le parti Colli devono essere separate:

- rotta pubblica dedicata;
- componenti dedicati;
- API dedicate;
- storage/data layer dedicato;
- tabelle dedicate;
- admin dedicato o sezione admin dedicata;
- permessi server-side dedicati.

## 10. Vincoli non negoziabili

### Non compromettere Camera con Vista

Non devono essere rotti, alterati o corrotti:

- homepage;
- layout pubblico;
- menu Camera con Vista;
- carta vini;
- cocktail bar;
- eventi;
- SEO generale;
- sitemap;
- admin principale;
- sincronizzazioni Google Sheets;
- database esistente;
- tabelle esistenti;
- snapshot esistenti;
- contenuti pubblici;
- immagini;
- route esistenti;
- deploy Render attuale;
- logiche mobile/desktop esistenti;
- gestione immagini;
- gestione eventi;
- gestione cocktail/vini/menu.

### Non compromettere CCV Colli

Non devono essere persi, eliminati o corrotti:

- sezioni Food, Drinks, Vini;
- categorie;
- prodotti;
- prezzi;
- allergeni;
- vini;
- categorie vino;
- logo;
- asset grafici;
- stile visuale;
- logiche menu;
- dati Supabase attuali;
- servizio Render attuale;
- admin Colli attuale finche serve come riferimento;
- esperienza QR/mobile-first attuale.

### Non spegnere ancora Render Colli

Il link seguente deve rimanere attivo fino a completa verifica produzione di `/colli/menu`:

```text
https://ccvcolli-ghxg.onrender.com
```

## 11. Regole QR

I nuovi QR code devono puntare solo a:

```text
https://www.cameraconvista.it/colli/menu
```

Non devono puntare a Render, Replit, Supabase, endpoint API, domini temporanei o URL intermedi.

Schema corretto:

```text
QR
-> https://www.cameraconvista.it/colli/menu
-> menu digitale Colli completo
```

Schema corretto per navigazione sito:

```text
-> pagina vetrina Colli
-> pulsante "Scopri il menu"
-> menu Colli
```

La pagina vetrina Colli esiste su `/colli`, ma non deve essere il target del QR menu.

## 12. Regole routing `/colli` e `/colli/menu`

La rotta `/colli` deve:

- mostrare una pagina vetrina Colli;
- includere foto principale;
- includere piccola gallery;
- includere indirizzo Colli nel corpo pagina, non nel footer:
  `Via Cavaioni 1, 40136, Bologna` / `presso Ca' Shin`;
- rendere l'indirizzo cliccabile/apribile su mappe, con logica coerente alla pagina "Dove siamo";
- includere pulsante "Scopri il menu";
- portare il pulsante a `/colli/menu`;
- usare il layout pubblico del sito principale;
- mantenere la voce Colli in navbar.

La rotta `/colli/menu` deve:

- mostrare direttamente il menu digitale Colli;
- essere mobile-first;
- essere navigabile anche da desktop;
- non richiedere un click intermedio;
- non dipendere dal layout marketing del sito se questo compromette fedelta visuale;
- non rompere header/footer/global layout esistenti;
- essere compatibile con SEO server-side;
- avere canonical dedicato;
- non confliggere con le route pubbliche esistenti.

Decisione aggiornata: `/colli/menu` usa layout dedicato full-screen. La fedelta al menu QR Colli ha priorita sulla coerenza marketing del sito principale.

Regola barra navigazione:

- voce `Colli` aggiunta nello Step 5B alla barra di navigazione principale;
- il testo `Colli` deve restare verde scuro;
- colore: `#5B7A4E`, coerente con il verde del progetto Colli;
- questa regola vale solo per la voce Colli, senza cambiare palette globale della navigazione CCV.
- la voce `Colli` della navbar punta a `/colli`, non al menu QR.

## 13. Regole admin e permessi

### Admin Camera con Vista

L'admin principale Camera con Vista gestisce il sito principale e, per Colli, solo la pagina vetrina `/colli`.

Regola:

- admin Camera con Vista = accesso globale;
- puo modificare sezioni principali CCV;
- puo modificare contenuti della vetrina Colli `/colli`;
- non deve modificare il menu digitale Colli Food/Drinks/Vini da admin SITE-CCV;
- puo usare strumenti admin esistenti e futuri.

### Admin Colli

Admin Colli deve poter gestire solo Colli.

Regole:

- il flusso UX deve restare coerente con Colli attuale: icona ingranaggio nel menu Colli, inserimento PIN/password, accesso al pannello Colli;
- l'icona ingranaggio deve vivere nell'esperienza menu Colli, quindi in `/colli/menu`;
- dopo login, admin Colli deve vedere solo il pannello Colli;
- puo gestire menu/sezione Colli;
- non puo modificare homepage Camera con Vista;
- non puo modificare menu Camera con Vista;
- non puo modificare carta vini Camera con Vista;
- non puo modificare cocktail bar;
- non puo modificare eventi;
- non puo modificare SEO globale, salvo eventuale SEO Colli consentito;
- non puo accedere a sync Google Sheets CCV;
- non puo accedere ad aree admin non Colli.

Serve una futura gestione ruoli/permessi server-side reale.

Nascondere voci UI lato client non basta. Gli endpoint devono bloccare direttamente richieste non autorizzate.

Il flusso visivo ingranaggio -> PIN/password -> admin Colli va mantenuto, ma l'implementazione insicura attuale non va copiata:

- niente PIN hardcoded lato client;
- niente endpoint CRUD admin senza middleware auth;
- niente accesso Colli basato solo su UI nascosta;
- enforcement obbligatorio lato server.

## 14. Strategia dati/Supabase

I dati Colli dovranno essere importati o clonati nel contesto Camera con Vista senza fondersi con le tabelle esistenti.

Non riusare direttamente:

- `menu_items`;
- `wines`;
- `cocktails`;
- snapshot `published_menu_items`;
- snapshot `published_wines`;
- snapshot `published_cocktails`;
- sync Google esistente.

Strategia consigliata: progettare tabelle dedicate e namespaced, per esempio:

- `colli_sections`;
- `colli_categories`;
- `colli_items`;
- `colli_wine_categories`;
- `colli_wines`;
- `colli_allergens`;
- `colli_settings`;
- `colli_menu_snapshots`, se serve logica publish.

Il modello finale va progettato prima di qualsiasi migrazione.

Migrazione dati controllata:

1. export o lettura dati dal Supabase Colli attuale;
2. backup/verifica dati sorgente;
3. creazione schema Colli dedicato nel Supabase principale;
4. import in tabelle `colli_*`;
5. verifica conteggi;
6. confronto con servizio Render attuale;
7. switch progressivo del menu QR su `/colli/menu` solo dopo verifiche.

Conteggi iniziali di controllo:

- sezioni = 3;
- categorie = 14;
- prodotti = 120;
- categorie vino = 5;
- vini = 11;
- allergeni = 14.

Se il menu Colli viene aggiornato prima della migrazione, questi numeri vanno riletti e aggiornati in questa scheda.

### Progetto schema Colli - Step 2

Step 2 eseguito il 2026-05-13 come sola progettazione documentale.

Decisione dati consolidata: il modello Colli deve essere separato dal modello CCV esistente e deve usare namespace `colli_*`.

Obiettivi del modello:

- preservare la struttura Food, Drinks, Vini;
- preservare categorie, prodotti, prezzi, allergeni e vini;
- non contaminare `menu_items`, `wines`, `cocktails` e relativi snapshot CCV;
- mantenere admin Colli separato e limitato al menu Colli;
- mantenere un flusso snapshot sicuro per il menu Colli;
- mantenere tracciabilita verso gli ID sorgente del progetto Colli attuale.

#### Tabelle proposte

Schema logico consigliato:

```text
colli_sections
  -> colli_categories
    -> colli_items
      -> colli_item_allergens
        -> colli_allergens

colli_wine_categories
  -> colli_wines

colli_menu_snapshots
colli_settings
```

##### `colli_sections`

Scopo: sezioni principali del menu Colli.

Campi consigliati:

- `id`: serial primary key;
- `source_id`: text unique nullable, ID originale Colli;
- `type`: text, esempio `food`, `drinks`, `wine`;
- `name_it`: text not null;
- `name_en`: text not null;
- `subtitle_it`: text nullable;
- `subtitle_en`: text nullable;
- `is_active`: boolean default true;
- `sort_order`: integer not null default 0;
- `created_at`: timestamp;
- `updated_at`: timestamp.

Note:

- `source_id` serve per import/migrazioni e confronto con Render Colli;
- `type = wine` identifica la sezione Vini senza automazioni distruttive.

##### `colli_categories`

Scopo: categorie Food/Drinks.

Campi consigliati:

- `id`: serial primary key;
- `section_id`: integer foreign key verso `colli_sections.id`;
- `source_id`: text unique nullable;
- `name_it`: text not null;
- `name_en`: text nullable;
- `is_active`: boolean default true;
- `sort_order`: integer not null default 0;
- `created_at`: timestamp;
- `updated_at`: timestamp.

Note:

- non usare nomi categoria come chiavi;
- preservare `sort_order` dalla sorgente;
- se `name_en` e vuoto nella sorgente, la UI puo fare fallback a `name_it`.

##### `colli_items`

Scopo: prodotti Food e Drinks.

Campi consigliati:

- `id`: serial primary key;
- `category_id`: integer foreign key verso `colli_categories.id`;
- `source_id`: text unique nullable;
- `name_it`: text not null;
- `name_en`: text nullable;
- `subtitle_it`: text nullable;
- `subtitle_en`: text nullable;
- `description_it`: text default empty;
- `description_en`: text default empty;
- `price`: numeric nullable;
- `vegetarian`: boolean default false;
- `extra_info`: text default empty;
- `is_available`: boolean default true;
- `sort_order`: integer not null default 0;
- `created_at`: timestamp;
- `updated_at`: timestamp.

Note:

- i prezzi Colli sono numerici; la formattazione euro resta responsabilita UI;
- non salvare il simbolo euro nel dato;
- non usare array allergeni nel record prodotto se si puo normalizzare.

##### `colli_allergens`

Scopo: dizionario allergeni Colli.

Campi consigliati:

- `id`: serial primary key;
- `source_id`: text unique nullable;
- `name_it`: text not null;
- `name_en`: text not null;
- `sort_order`: integer not null default 0;
- `created_at`: timestamp;
- `updated_at`: timestamp.

##### `colli_item_allergens`

Scopo: relazione molti-a-molti tra prodotti e allergeni.

Campi consigliati:

- `item_id`: integer foreign key verso `colli_items.id`;
- `allergen_id`: integer foreign key verso `colli_allergens.id`;
- primary key composta su `item_id`, `allergen_id`.

Note:

- il progetto Colli attuale usa array di ID allergeni su `dishes`;
- in `SITE-CCV` e preferibile normalizzare per scalabilita e controlli admin.

##### `colli_wine_categories`

Scopo: categorie vino Colli.

Campi consigliati:

- `id`: serial primary key;
- `source_id`: text unique nullable;
- `name_it`: text not null;
- `name_en`: text nullable;
- `is_active`: boolean default true;
- `sort_order`: integer not null default 0;
- `created_at`: timestamp;
- `updated_at`: timestamp.

##### `colli_wines`

Scopo: vini Colli.

Campi consigliati:

- `id`: serial primary key;
- `wine_category_id`: integer foreign key verso `colli_wine_categories.id`;
- `source_id`: text unique nullable;
- `name_it`: text not null;
- `name_en`: text nullable;
- `producer`: text default empty;
- `origin`: text default empty;
- `abv`: numeric nullable;
- `price_glass`: numeric nullable;
- `price_bottle`: numeric nullable;
- `is_available`: boolean default true;
- `sort_order`: integer not null default 0;
- `created_at`: timestamp;
- `updated_at`: timestamp.

Note:

- non riusare la tabella `wines` di CCV;
- Colli ha prezzi calice/bottiglia distinti e categorie proprie.

##### `colli_settings`

Scopo: impostazioni specifiche Colli.

Campi consigliati:

- `id`: serial primary key;
- `key`: text unique not null;
- `value`: jsonb nullable;
- `updated_at`: timestamp.

Chiavi operative:

- `last_import`: riepilogo ultima importazione dati Colli;
- `admin_password_hash`: hash bcrypt della password/PIN admin Colli;
- `english_enabled`: booleano opzionale per abilitare/disabilitare la lingua inglese nel menu Colli pubblico e nel pannello admin Colli; se assente il sistema assume `true`.

Possibili chiavi future:

- logo/asset pubblico Colli;
- testo footer collaborazione CA'SHIN;
- lingua inglese abilitata/disabilitata;
- opzioni UI mobile;
- eventuali link operativi Colli.

##### `colli_menu_snapshots`

Scopo: snapshot pubblici del menu Colli.

Campi consigliati:

- `id`: serial primary key;
- `status`: text, esempio `active`, `archived`;
- `snapshot`: jsonb not null;
- `source_checksum`: text nullable;
- `published_by`: text nullable;
- `published_at`: timestamp not null;
- `created_at`: timestamp.

Decisione consigliata:

- il pubblico `/api/colli/menu` dovrebbe leggere lo snapshot attivo;
- l'admin Colli dovrebbe modificare tabelle draft/live operative e poi pubblicare;
- questo evita che modifiche parziali appaiano subito ai clienti;
- il flusso resta separato dagli snapshot CCV esistenti in `site_settings`.

#### Indici consigliati

Indici minimi:

- unique su tutti i `source_id` quando valorizzati;
- index su `colli_categories.section_id`;
- index su `colli_items.category_id`;
- index su `colli_item_allergens.item_id`;
- index su `colli_item_allergens.allergen_id`;
- index su `colli_wines.wine_category_id`;
- index su `colli_menu_snapshots.status`;
- index su `sort_order` dove utile per letture ordinate.

#### Regole di migrazione

Mapping iniziale:

- `sections` -> `colli_sections`;
- `categories` -> `colli_categories`;
- `dishes` -> `colli_items`;
- `allergens` -> `colli_allergens`;
- `dishes.allergens[]` -> `colli_item_allergens`;
- `wine_categories` -> `colli_wine_categories`;
- `wines` -> `colli_wines`.

Regole:

- conservare gli ID sorgente in `source_id`;
- non usare `source_id` come chiave applicativa primaria futura;
- importare prima dizionari e parent, poi child;
- verificare conteggi dopo ogni blocco;
- generare snapshot pubblico solo dopo import completo e validato;
- non eseguire migrazioni senza backup aggiornato.

#### Regole permessi dati

Ruoli futuri consigliati:

- `admin`: accesso globale;
- `colli_admin`: accesso solo dati e API Colli.

Requisito tecnico:

- l'attuale sessione admin non basta per permessi granulari;
- servira associare sessione a utente/ruolo o introdurre un sistema equivalente;
- enforcement obbligatorio lato server su ogni endpoint admin Colli.

#### Decisione su Drizzle/Supabase

Step 5A eseguito il 2026-05-13 come preparazione codice, senza migrazione reale.

- aggiornato `shared/schema.ts` con tabelle Drizzle dedicate `colli_*`;
- aggiunto contratto dati condiviso in `shared/colli.ts`;
- aggiunto script `scripts/colli-import-dry-run.ts`;
- verificata compatibilita TypeScript;
- non lanciato `db:push`;
- non creata nessuna tabella su Supabase;
- non eseguita nessuna scrittura dati.

Regola ancora valida: la migrazione reale dovra essere controllata e reversibile, non un push automatico non revisionato.

## 15. Architettura attuale consolidata

### Frontend pubblico

File creati nello Step 4:

- `client/src/pages/colli.tsx`;
- `client/src/pages/colli-menu.tsx`;
- `client/src/components/colli/ColliMenuApp.tsx`;
- `attached_assets/logo_ccv_colli.png`, copiato dal logo ufficiale in `ccv-colli-source/assets/images/logo.png`.

File collegati:

- `client/src/App.tsx`, rotte pubbliche `/colli` e `/colli/menu`.

Requisiti:

- rotta pubblica `/colli` come vetrina;
- rotta pubblica `/colli/menu` come menu diretto;
- mobile-first;
- layout full-screen dedicato per `/colli/menu`, senza header/footer globale del sito principale;
- fedelta visuale al menu Colli attuale;
- nel menu pubblico Colli, i prezzi devono essere in grassetto e i prodotti vegetariani devono mostrare una foglia piena sempre prima del nome (`foglia + spazio + testo`), mai a fine testo;
- vetrina `/colli` con foto principale, piccola gallery e CTA verso menu.
- la vetrina `/colli` usa blocchi CMS standard (`ImageContainer`, `EditableText`, `usePageBlocks`) per essere gestibile dall'admin SITE-CCV come le altre pagine.
- indirizzo Colli integrato nella vetrina come blocco contenuto, non nel footer.

### Backend/API

File creati:

- `server/routes/colli.ts`;
- `server/routes/colli-admin.ts`;
- montaggio in `server/routes/index.ts`.

Endpoint pubblico:

- `GET /api/colli/menu`;

Stato attuale:

- endpoint pubblico read-only;
- fonte primaria: snapshot Supabase interno `colli_menu_snapshots`;
- fallback: bridge server-side verso `https://ccvcolli-ghxg.onrender.com/api/menu/draft`;
- cache server breve, 60 secondi, per ridurre carico sulla sorgente Render;
- payload mantenuto compatibile con la sorgente Colli e arricchito con `metadata` tecnica di controllo.

Endpoint admin operativi:

- login/logout/check session Colli;
- summary e menu admin;
- CRUD e riordino per sezioni, categorie, prodotti, categorie vino, vini e allergeni;
- eliminazioni protette da PIN server-side;
- ogni mutazione aggiorna `colli_menu_snapshots` e invalida la cache pubblica.

### Storage/data layer

Stato attuale:

- dati menu Colli in tabelle dedicate `colli_*`;
- snapshot pubblici in `colli_menu_snapshots`;
- vetrina `/colli` in `pages` e `page_blocks`;
- snapshot CMS dei blocchi in `page_blocks.metadata.__publishedSnapshot`.

Regola: evitare contaminazione con storage menu/vini/cocktail CCV.

### Admin

Stato admin vetrina `/colli`:

- aggiunto tab `Colli` in `client/src/pages/admin/pages.tsx`;
- la pagina usa i blocchi CMS standard per immagine hero, testo intro, CTA e gallery;
- l'admin SITE-CCV puo gestire la vetrina `/colli`, non i dati menu Colli;
- la gestione del menu Colli resta separata e avviene dal flusso ingranaggio dentro `/colli/menu`;
- migrazione SQL `migrations/20260513_add_colli_cms_page.sql` applicata;
- pagina CMS `colli` pubblicata con 0 blocchi in bozza.

Stato admin menu Colli:

- route canonica `/colli/admina`;
- pannello operativo `/colli/admina/panel`;
- sessione separata `ccv_colli_admin_session`;
- dati popolati da tabelle `colli_*`;
- admin SITE-CCV resta autorizzato anche lato server;
- admin Colli resta separato dall'admin principale `/admina`.

### SEO

File aggiornati nello Step 4:

- `server/seo.ts`;
- sitemap aggiornata;
- title/description dedicati;
- canonical `/colli` e `/colli/menu`;
- JSON-LD menu specifico su `/colli/menu`.

Regola: non rompere SEO esistente.

## 16. File/cartelle coinvolti

Documentazione:

- `DNA/CCV_COLLI_INTEGRATION.md`;
- `README_OPERATIVO.md`;
- `DNA/01_MAPPA_TECNICA.md`;
- `DNA/03_DATI_SYNC_SUPABASE.md`;
- `DNA/04_OPERATIONS_DEPLOY_GITHUB.md`.

Frontend:

- `client/src/App.tsx`;
- `client/src/pages/colli.tsx`;
- `client/src/pages/colli-menu.tsx`;
- `client/src/pages/colli-admin-login.tsx`;
- `client/src/pages/colli-admin-panel.tsx`;
- `client/src/components/colli/`;
- `client/src/components/layout/Header.tsx`;
- `client/src/pages/admin/pages.tsx`;
- `attached_assets/logo_ccv_colli.png`;
- `attached_assets/colli-nav.webp`.

Backend:

- `server/routes/index.ts`;
- `server/routes/colli.ts`;
- `server/routes/colli-admin.ts`;
- `server/seo.ts`;
- `server/storage.ts`;
- `server/supabase-storage.ts`.

Dati/schema:

- `shared/schema.ts`;
- `shared/colli.ts`;
- `scripts/colli-import-dry-run.ts`;
- `scripts/colli-import.ts`;
- `scripts/colli-db-readiness-check.ts`;
- `migrations/20260513_create_colli_tables.sql`;
- `migrations/20260513_add_colli_cms_page.sql`.

Test:

- `e2e/public-smoke.spec.ts`;
- `tests/unit/colli.test.ts`;
- eventuali test unitari dedicati Colli se la logica cresce.

Cartella riferimento:

- `ccv-colli-source/` rimossa dalla workspace finale; non e richiesta per build, test, deploy o runtime.

## 17. Cosa non fare assolutamente

Non fare:

- non copiare `ccv-colli-source/package.json` nel progetto principale;
- non importare `node_modules` di Colli;
- non installare Expo dentro `SITE-CCV` senza motivo esplicito;
- non installare React Native Web dentro `SITE-CCV` senza motivo esplicito;
- non forzare React 19 nel progetto principale;
- non importare Expo Router;
- non cambiare routing globale senza analisi;
- non fondere dati Colli con menu/vini/cocktail Camera con Vista;
- non collegare Colli alla sync Google esistente;
- non copiare auth/admin Colli attuale cosi com'e;
- non usare PIN hardcoded;
- non esporre service key Supabase;
- non fare `db:push` senza piano;
- non fare migrazioni DB automatiche senza backup;
- non usare deploy script di Colli;
- non includere `ccv-colli-source/` nei controlli lint/build del progetto principale;
- non spegnere Render Colli;
- non fare push/deploy prima dei test;
- non modificare homepage/menu/vini/cocktail/eventi durante questa integrazione;
- non introdurre duplicazioni o logiche parallele non documentate.

## 18. Piano operativo futuro a step

### Step 0 - Documentazione

- creare questa scheda;
- usarla come fonte di verita;
- aggiornarla a ogni fase.

### Step 1 - Freeze e backup

- confermare che Colli Render continua a funzionare;
- salvare/export dati Colli;
- salvare conteggi;
- documentare sorgenti dati.

### Step 2 - Progettazione schema Colli

- definire tabelle `colli_*`;
- definire relazioni;
- definire eventuale publish/snapshot;
- definire permessi.

### Step 3 - API read-only

Stato: completato il 2026-05-13.

- creato endpoint pubblico read-only `/api/colli/menu`;
- creato file dedicato `server/routes/colli.ts`;
- montato router in `server/routes/index.ts` sotto namespace `/api/colli`;
- nessun admin Colli creato;
- nessuna modifica database;
- nessuna migrazione Supabase;
- fonte temporanea: `https://ccvcolli-ghxg.onrender.com/api/menu/draft`;
- conteggi di controllo restituiti dall'endpoint: 3 sezioni, 14 categorie, 120 prodotti, 5 categorie vino, 11 vini, 14 allergeni.

Verifiche eseguite:

- `npm run check`: OK;
- `npm test`: OK;
- `npm run lint`: OK, dopo esclusione di `ccv-colli-source/` dai controlli del progetto principale;
- `npm run format:check`: OK;
- `npm run build`: OK con warning PostCSS gia presente/non bloccante;
- `GET http://localhost:5001/api/colli/menu`: OK;
- `GET http://localhost:5001/`: OK.

### Step 4 - Pagina pubblica `/colli/menu`

Stato: completato il 2026-05-13.

- creata pagina menu pubblica `/colli/menu`;
- creata esperienza menu diretta per QR;
- creata UI React web nativa, senza importare Expo o React Native Web;
- usato layout full-screen dedicato per rispettare esperienza QR/mobile-first;
- aggiunto logo Colli in `attached_assets/logo_ccv_colli.png`;
- collegate sezioni Food, Drinks e Vini ai dati di `/api/colli/menu`;
- aggiunta navigazione hamburger interna Colli;
- aggiunto cambio lingua IT/EN usando `LanguageContext` esistente del sito;
- aggiunta visualizzazione categorie, prodotti, prezzi, vini, allergeni e dettaglio prodotto;
- non modificato database;
- non modificati menu, vini, cocktail, eventi o homepage Camera con Vista.

### Step 4B - Vetrina pubblica `/colli`

Stato: completato e riallineato il 2026-05-13.

- `/colli` convertita in pagina vetrina;
- aggiunta foto principale;
- aggiunta piccola gallery;
- aggiunto pulsante "Scopri il menu";
- il pulsante porta a `/colli/menu`;
- mantenuto layout pubblico del sito principale;
- rimosso titolo visibile "Colli";
- ottimizzato contenuto desktop/mobile con logo, micro-label Food/Drinks/Vini, testo descrittivo e CTA;
- ottimizzato mobile per mostrare nella prima vista immagine principale, logo, testo, CTA e indirizzo prima delle gallery;
- aggiunto indirizzo nel corpo pagina: `Via Cavaioni 1, 40136, Bologna` / `presso Ca' Shin`;
- reso l'indirizzo cliccabile con scelta Apple Mappe / Google Maps;
- aggiunto link Instagram Colli sotto l'indirizzo: `https://www.instagram.com/cameraconvistacolli/`;
- reso `Food · Drinks · Vini` contenuto CMS modificabile da admin SITE-CCV nel blocco `intro`;
- ingrandito il logo Colli della vetrina del 25%;
- confermato che l'indirizzo non va inserito nel footer;
- collegata ai blocchi CMS standard per gestione admin SITE-CCV;
- aggiunto tab Colli in admin `Sezioni Pagine`;
- applicata migrazione SQL dedicata per pagina/blocchi CMS Colli;
- pagina CMS `colli` pubblicata;
- il menu digitale resta separato e gestito solo da admin Colli.

### Step 5 - Migrazione Supabase

Stato: migrazione schema e import iniziale completati il 2026-05-13.

Completato nello Step 5A:

- aggiunto modello Drizzle dedicato `colli_*` in `shared/schema.ts`;
- aggiunto contratto dati condiviso `shared/colli.ts`;
- aggiunto dry-run import in `scripts/colli-import-dry-run.ts`;
- aggiunto import controllato in `scripts/colli-import.ts`;
- aggiunto check DB read-only in `scripts/colli-db-readiness-check.ts`;
- aggiunti comandi `npm run colli:db:check`, `npm run colli:import:dry-run` e `npm run colli:import`;
- verificati dati da backup freeze e da API Render attuale;
- verificati conteggi 3/14/120/5/11/14;
- verificato piano import:
  - `colli_sections`: 3;
  - `colli_categories`: 14;
  - `colli_items`: 120;
  - `colli_wine_categories`: 5;
  - `colli_wines`: 11;
  - `colli_allergens`: 14;
  - `colli_item_allergens`: 28;
  - `colli_menu_snapshots`: 1;
- nessuna relazione mancante;
- nessun ID sorgente duplicato;

Verifica DB prima della migrazione del 2026-05-13:

- backend locale collegato a Supabase tramite `DATABASE_URL`;
- pagina CMS `colli`: assente;
- blocchi CMS `/colli`: assenti;
- tabelle `colli_*`: assenti;
- sorgente Render Colli: raggiungibile;
- conteggi sorgente: 3 sezioni, 14 categorie, 120 prodotti, 5 categorie vini, 11 vini, 14 allergeni;
- interpretazione: `/colli` usa default codice, `/colli/menu` usa ancora bridge Render.

Completato nello Step 5C:

- applicata migrazione CMS `migrations/20260513_add_colli_cms_page.sql`;
- creati pagina CMS `colli` e 8 blocchi vetrina;
- applicata migrazione tabelle `migrations/20260513_create_colli_tables.sql`;
- create tabelle indipendenti `colli_*`;
- importati dati Colli iniziali in tabelle dedicate;
- creato snapshot attivo in `colli_menu_snapshots`;
- `/api/colli/menu` ora legge prima da snapshot Supabase interno `siteccv-supabase-snapshot`;
- fallback Render mantenuto se lo snapshot interno non e disponibile;
- nessuna modifica a `menu_items`, `wines`, `cocktails`, `events`, `site_settings` fuori dai nuovi oggetti Colli;
- backup locale pre migrazione CMS creato in `BACKUP/pre_colli_cms_migration_*.json`.

Conteggi DB Colli dopo import e test admin controllato:

- `colli_sections`: 3;
- `colli_categories`: 14;
- `colli_items`: 120;
- `colli_allergens`: 14;
- `colli_item_allergens`: 28;
- `colli_wine_categories`: 5;
- `colli_wines`: 11;
- `colli_settings`: 2;
- `colli_menu_snapshots`: 5 totali dopo test controllato, con 1 solo snapshot `active`.

Completato nello Step 5B:

- preparata migrazione SQL revisionabile in `migrations/20260513_create_colli_tables.sql`;
- aggiunta voce `Colli` nella navigazione pubblica principale;
- voce testuale sostituita con asset ottimizzato `attached_assets/colli-nav.webp`;
- aggiunto test e2e per verificare visibilita e dimensione leggera dell'icona Colli;
- migrazione applicata nello Step 5C;
- dati importati nello Step 5C.

Stato enterprise residuo:

- ruoli/utenti multipli granulari restano opzionali e da attivare solo se il cliente richiede piu account distinti.

### Step 6 - Admin Colli

Stato: completato per il pannello operativo base il 2026-05-13.

Completato:

- aggiunta icona ingranaggio nel menu a tendina di `/colli/menu`;
- l'ingranaggio porta a `/colli/admina`;
- indirizzi admin canonici:
  - admin Colli: `/colli/admina`;
  - admin SITE-CCV: `/admina`;
- creata login page Colli separata;
- creata sessione Colli separata con cookie `ccv_colli_admin_session`;
- il cookie Colli deve restare cookie di sessione browser/app, senza `Max-Age`/`Expires`; lato server la sessione conserva comunque una scadenza di sicurezza;
- password Colli salvata come hash server-side in `colli_settings`;
- creato endpoint protetto `/api/colli/admin/summary`;
- creata pagina `/colli/admina/panel` protetta e separata dal pannello SITE-CCV;
- mantenuti redirect di compatibilita da `/colli/admin` verso `/colli/admina`;
- admin SITE-CCV resta autorizzato anche lato server;
- test e2e aggiunto per verificare presenza ingranaggio e accesso alla login Colli.
- sostituita la shell provvisoria con pannello operativo in stile admin Colli originale;
- il pannello legge i record dalle tabelle dedicate `colli_*` del Supabase principale;
- aggiunti CRUD per sezioni, categorie, prodotti, categorie vino, vini e allergeni;
- aggiunto riordino con pulsanti su/giu coerente con il pannello Colli originale;
- aggiunta conferma PIN server-side per le eliminazioni;
- ogni salvataggio aggiorna lo snapshot pubblico `colli_menu_snapshots`;
- invalidata cache `/api/colli/menu` dopo le modifiche admin.

Residuo non bloccante:

- rifinire eventuali micro-differenze visuali rispetto al vecchio pannello Expo dopo revisione cliente;
- completare eventuale gestione utenti/credenziali multiple se richiesta;
- completare permessi granulari finali per admin Colli se il sito dovra distinguere piu ruoli reali.

### Step 7 - SEO e routing

Stato: completato per la parte pubblica iniziale il 2026-05-13.

- aggiunte rotte frontend `/colli` e `/colli/menu`;
- aggiunti title/description dedicati;
- aggiunti canonical dedicati;
- aggiunti `/colli` e `/colli/menu` in sitemap;
- aggiunto JSON-LD menu dedicato su `/colli/menu`;
- nessuna modifica distruttiva alla SEO esistente.

### Step 8 - Test regressione

- test sito principale;
- test Colli;
- test admin;
- test dati;
- test mobile;
- test deploy locale/staging.

### Step 9 - Deploy controllato

- build;
- test;
- deploy;
- verifica produzione;
- usare QR definitivo solo dopo verifica.

### Step 10 - QR definitivo

- generare/stampare QR che punta solo a:

```text
https://www.cameraconvista.it/colli/menu
```

## 19. Checklist test

### Test pubblici Camera con Vista

Dopo ogni implementazione futura verificare:

- homepage;
- `/menu`;
- `/lista-vini`;
- `/cocktail-bar`;
- `/eventi`;
- pagine principali;
- navigazione mobile;
- SEO base;
- sitemap/robots se toccati;
- admin principale;
- sync Google Sheets.

### Test Colli

Test automatici aggiunti nello Step 4:

- rotta pubblica `/colli` dentro `e2e/public-smoke.spec.ts`;
- rotta pubblica `/colli/menu` dentro `e2e/public-smoke.spec.ts`;
- API `/api/colli/menu` con verifica sezioni Food, Drinks e Vini;
- test vetrina `/colli` con CTA verso `/colli/menu`;
- test vetrina `/colli` su mobile con immagine principale, logo, CTA e indirizzo nella prima vista;
- test vetrina `/colli` con link Instagram Colli e allineamento gruppo indirizzo/social alla base dell'immagine principale;
- test mobile `/colli/menu` con apertura Food e verifica categoria Focacce.

Verifiche eseguite nello Step 4:

- `npm run check`: OK;
- `npm run lint`: OK;
- `npm run format:check`: OK;
- `npm test`: OK;
- `npm run build`: OK con warning PostCSS gia presente/non bloccante;
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:5001 npx playwright test --project=chromium`: OK, 21/21;
- screenshot/report Playwright generati durante le verifiche e rimossi dopo i test per non sporcare il progetto;
- `/colli`: HTTP 200;
- `/colli/menu`: HTTP 200;
- `/api/colli/menu`: HTTP 200;
- sitemap contiene `/colli` e `/colli/menu`;
- HTML `/colli` e `/colli/menu` contiene title e canonical dedicati.
- controllo vetrina `/colli`: nessun titolo visibile "Colli"; resta solo logo Colli e micro-label Food/Drinks/Vini gestibile dal CMS;
- controllo mobile `/colli`: primo viewport senza overflow orizzontale, con immagine principale, logo, testo, CTA e indirizzo visibili.

Verificare:

- `/colli`;
- apertura da smartphone;
- apertura da desktop;
- sezioni Food, Drinks, Vini;
- navigazione hamburger;
- categorie;
- prodotti;
- prezzi;
- allergeni;
- vini;
- confronto visivo con `https://ccvcolli-ghxg.onrender.com`;
- confronto dati con API sorgente;
- performance mobile.

### Test admin/permessi

Verificare:

- admin Camera con Vista accede a tutto;
- admin Camera con Vista accede a Colli;
- admin Colli accede solo a Colli;
- admin Colli non accede ad aree CCV;
- endpoint server-side protetti davvero;
- tentativi diretti via API bloccati;
- UI client coerente con permessi, ma non unica difesa.

## 20. Checklist migrazione dati

Prima di migrare:

- confermare sorgente dati Colli;
- fare export/backup;
- salvare conteggi;
- salvare timestamp;
- verificare che Render Colli funzioni.

Durante la migrazione:

- creare schema dedicato;
- importare sezioni;
- importare categorie;
- importare prodotti;
- importare categorie vino;
- importare vini;
- importare allergeni;
- preservare order e relazioni;
- preservare campi bilingue dove presenti;
- preservare prezzi numerici e formattazione UI.

Dopo la migrazione verificare conteggi minimi:

- sezioni = 3;
- categorie = 14;
- prodotti = 120;
- categorie vino = 5;
- vini = 11;
- allergeni = 14.

Se i numeri cambiano per aggiornamenti reali del menu Colli, annotare qui i nuovi conteggi attesi.

## 21. Checklist sicurezza

Verifiche obbligatorie future:

- nessuna service key Supabase nel client;
- nessuna secret in commit, chat, screenshot o documentazione;
- endpoint admin Colli protetti server-side;
- ruoli verificati lato server;
- admin Colli bloccato su endpoint CCV;
- admin globale autorizzato su tutto;
- nessun PIN hardcoded;
- nessun deploy script Colli usato dentro `SITE-CCV`;
- nessuna mutazione DB automatica all'avvio senza controllo;
- nessun `db:push` senza piano, backup e revisione schema;
- RLS/policy valutate prima di esporre nuove tabelle.

## 22. Domande ancora aperte

Domande risolte negli step 3-4:

- primo rilascio `/colli` read-only: si, creato prima dell'admin Colli;
- layout `/colli/menu`: full-screen dedicato, senza header/footer globale;
- layout `/colli`: vetrina pubblica con foto, gallery e CTA;
- SEO `/colli` e `/colli/menu`: title, description, canonical, sitemap e JSON-LD menu dove pertinente;
- asset logo Colli: `attached_assets/logo_ccv_colli.png`.
- migrazione dati Colli: completata su tabelle dedicate `colli_*`;
- flusso snapshot Colli: lo snapshot pubblico viene aggiornato automaticamente dopo le modifiche admin.

Domande ancora aperte prima degli step successivi:

- L'inglese va mantenuto anche dove alcuni campi Colli sono incompleti?
- Quali credenziali/utenti concreti devono diventare admin Colli?
- Quale deve essere la data di switch QR definitivo su `https://www.cameraconvista.it/colli/menu`?

## 23. Decisione finale consolidata

Decisione finale:

```text
Conviene integrare parzialmente: ricostruire /colli e /colli/menu in SITE-CCV, mantenendo dati, logica e admin Colli separati e namespaced. Non conviene importare direttamente il progetto Expo.
```

Questa decisione resta valida finche non emergono vincoli tecnici nuovi e documentati.

## 24. Log aggiornamenti della scheda

- 2026-05-13: creata scheda tecnica iniziale. Consolidata diagnosi preliminare, decisione di integrazione parziale, vincoli, strategia dati, architettura futura, piano operativo e checklist.
- 2026-05-13: completato Step 1 freeze e backup. Verificato servizio Render Colli, esportato menu in `BACKUP/colli_menu_freeze_2026-05-13_13-03-41.json`, confermati conteggi 3/14/120/5/11/14.
- 2026-05-13: completato Step 2 progettazione schema. Documentato modello `colli_*` separato, relazioni, snapshot pubblico, mapping migrazione, indici e prerequisiti ruoli/permessi.
- 2026-05-13: completato Step 3 API read-only. Creato `GET /api/colli/menu` come bridge temporaneo server-side verso Render Colli, senza admin, senza scritture database e senza migrazioni.
- 2026-05-13: esclusa `ccv-colli-source/` dai controlli lint e dal tracking Git del progetto principale, per mantenerla come sola sorgente di riferimento esterna.
- 2026-05-13: verificato Step 3 con TypeScript, test unitari, lint, format check, build, home locale e endpoint `/api/colli/menu` su porta 5001.
- 2026-05-13: completato Step 4 pagina pubblica menu `/colli/menu`. Ricostruita esperienza menu Colli in React web nativo, con logo, sezioni Food/Drinks/Vini, navigazione hamburger, categorie, prodotti, prezzi, vini, allergeni e layout QR/mobile-first.
- 2026-05-13: completato Step 7 SEO/routing pubblico iniziale. Aggiunti title/description, canonical e sitemap per `/colli` e `/colli/menu`, con JSON-LD menu su `/colli/menu`.
- 2026-05-13: verificato Step 4 con TypeScript, lint, format check, test unitari, build, Playwright e screenshot mobile/desktop su porta 5001.
- 2026-05-13: registrata regola navigazione futura. Quando la voce Colli verra aggiunta alla barra di navigazione principale, il testo dovra essere verde scuro `#5B7A4E`.
- 2026-05-13: completato Step 5A preparazione dati. Aggiunti schema Drizzle `colli_*`, contratto condiviso `shared/colli.ts`, dry-run import e test unitario, senza `db:push` e senza scritture database.
- 2026-05-13: completato Step 5B preparazione migrazione e navigazione. Aggiunta voce Colli verde scuro in navbar, creato SQL `migrations/20260513_create_colli_tables.sql` e aggiunto test e2e dedicato, senza applicare migrazioni e senza scritture database.
- 2026-05-13: recepita correzione routing. `/colli` e vetrina pubblica, `/colli/menu` e target unico QR e menu digitale diretto. Documentato vincolo admin Colli: ingranaggio nel menu, PIN/password, accesso solo area Colli con protezione server-side futura.
- 2026-05-13: completato riallineamento routing/UI. `/colli` ora e vetrina con foto, gallery e CTA; `/colli/menu` resta menu digitale diretto. Verificati TypeScript, lint, format, test unitari, build, Playwright 17/17 e app attiva su porta 5001.
- 2026-05-13: ottimizzata vetrina `/colli`. Rimosso titolo visibile "Colli", integrati blocchi CMS standard per hero/testo/CTA/gallery, aggiunto tab Colli in admin pagine, preparata migrazione SQL CMS `20260513_add_colli_cms_page.sql` senza eseguirla.
- 2026-05-13: aggiornato indirizzo Colli nella vetrina `/colli` a `Via Cavaioni 1, 40136, Bologna` / `presso Ca' Shin`; indirizzo posizionato nel corpo pagina, non nel footer, e reso apribile con Apple Mappe / Google Maps. Verificato perimetro admin: SITE-CCV gestisce solo vetrina Colli; menu Colli resta separato e dovra essere gestito dal flusso ingranaggio in `/colli/menu`.
- 2026-05-13: verifiche post-modifica indirizzo completate: TypeScript, lint, formattazione, test unitari, build e smoke Playwright su `http://127.0.0.1:5001`.
- 2026-05-13: ingrandito logo Colli nella vetrina `/colli` del 25%. Aggiunti comandi operativi read-only `colli:db:check` e `colli:import:dry-run`. Verificato stato Supabase: pagina CMS `colli` e tabelle `colli_*` ancora assenti; bridge Render ancora sorgente menu attiva.
- 2026-05-13: applicata migrazione CMS Colli su Supabase con backup locale preventivo e transazione. Creati pagina `colli` e blocchi vetrina dedicati.
- 2026-05-13: applicata migrazione tabelle indipendenti `colli_*`, importati dati Colli iniziali e creato snapshot attivo. `/api/colli/menu` legge ora da `colli_menu_snapshots` con fallback Render.
- 2026-05-13: verificate migrazioni e import con `colli:db:check`, TypeScript, lint, format, test unitari, build e Playwright 17/17 su porta 5001.
- 2026-05-13: avviato Step 6 Admin Colli. Aggiunto ingranaggio nel menu `/colli/menu`, login separato canonico `/colli/admina`, cookie sessione Colli, hash password in `colli_settings` e shell protetta `/colli/admina/panel`. Pannello CRUD Colli ancora da completare.
- 2026-05-13: consolidata regola URL admin: Colli usa sempre `/colli/admina`, SITE-CCV usa sempre `/admina`; `/colli/admin` resta solo redirect di compatibilita.
- 2026-05-13: completato Step 6 Admin Colli operativo. Sostituita shell provvisoria con pannello CRUD in stile admin Colli originale, popolato da `colli_*`, con riordino, modali edit, conferma PIN server-side sulle eliminazioni e aggiornamento automatico dello snapshot pubblico.
- 2026-05-13: aggiornata navigazione principale. La voce testuale Colli e stata sostituita con asset ottimizzato `attached_assets/colli-nav.webp`, dimensionato per navbar e mantenuto leggero.
- 2026-05-13: fix vetrina Colli. Il micro-titolo `Food · Drinks · Vini` non e piu hardcoded: e ora modificabile da admin SITE-CCV come titolo del blocco CMS `intro`, con gestione IT/EN e dimensioni testo.
- 2026-05-13: ottimizzato layout mobile della vetrina `/colli`. Su viewport 390x844 la prima vista mostra immagine principale, logo, micro-titolo, testo, pulsante menu e indirizzo; le gallery iniziano dopo il blocco principale. Aggiunto smoke test e2e dedicato.
- 2026-05-13: aggiunto link Instagram Colli sopra l'indirizzo nella vetrina `/colli`, mantenendo il gruppo social/indirizzo allineato alla base dell'immagine principale e verificandolo con test e2e.
- 2026-05-13: aumentata del 20% circa la dimensione del micro-titolo `Food · Drinks · Vini` nella vetrina `/colli`; aggiornati default desktop/mobile e blocco CMS pubblicato.
- 2026-05-13: pubblicata la pagina CMS `colli` nel Supabase SITE-CCV. Stato finale: pagina visibile, non in bozza, blocchi pubblicati e snapshot CMS salvati in `metadata.__publishedSnapshot`.
- 2026-05-13: aggiunto CTA `Prenota` nella vetrina `/colli`, collegato a WhatsApp `+393335345751` e gestito come blocco CMS `booking-cta`, mantenendo `Scopri il menu` come CTA principale.
- 2026-05-13: resa configurabile da admin SITE-CCV la destinazione WhatsApp del CTA `Prenota` Colli. Il numero vive in `site_settings.colli_booking_settings` ed e modificabile da `Impostazioni -> Prenotazione Colli`, senza toccare menu digitale o admin Colli.
- 2026-05-13: eseguito test admin Colli reale e controllato. Modificato temporaneamente un prodotto via endpoint admin, verificata propagazione su `/api/colli/menu`, poi ripristinato il valore originale. Conteggi finali invariati 3/14/120/5/11/14.
- 2026-05-13: creati backup enterprise pre-cleanup in `BACKUP/`: archivio operativo sorgente con `.env` incluso e snapshot JSON DB Colli/CMS.
- 2026-05-13: pulizia sicura progetto. Rimossi artefatti generati `dist/`, `coverage/`, `test-results/` e asset sorgente non usato `attached_assets/colli.png`; ripulita `ccv-colli-source/` da `.git`, `.local`, `.expo`, `node_modules`, `dist` e `server_dist`, mantenendo solo i sorgenti di riferimento non versionati.
- 2026-05-13: suite finale completata senza commit/push. Verdi TypeScript, lint, format, test unitari, build, e2e 21/21 e check DB Colli; `npm audit` resta rosso per vulnerabilita moderate transitive `express-rate-limit`/`ip-address`, da gestire in step dedicato.
- 2026-05-13: creato backup operativo post-integrazione in `BACKUP/`: stato dati Colli/Supabase in JSON e archivio mirato dei file di lavoro modificati.
- 2026-05-13: eseguita pulizia mirata post-configurazione Prenota. Rimossi solo artefatti generati certi (`.DS_Store`, `test-results`, `dist` post-build) e creato backup operativo finale post-cleanup con snapshot DB Colli/CMS.
- 2026-05-13: pulizia finale workspace. Rimossa `ccv-colli-source/` perche non funzionale al runtime e pulita `BACKUP/`, mantenendo solo archivio operativo finale e snapshot DB finale.
- 2026-05-13: micro-cleanup client sicuro. Rimossi `client/src/components/home/PhilosophySection.tsx` e `client/src/components/home/TeaserCard.tsx`, verificati come non importati e non referenziati.
- 2026-05-13: suite completa post micro-cleanup. Verdi `check`, `lint`, `format:check`, test unitari, build, Playwright e2e 22/22 e `colli:db:check`; resta rosso solo `npm audit` per vulnerabilita moderate transitive `express-rate-limit`/`ip-address`, da trattare come step dedicato prima del push se si vuole pipeline GitHub totalmente verde.
- 2026-05-13: documentazione DNA riallineata per stato enterprise: mappa tecnica, dati/Supabase, operations/GitHub e scheda Colli aggiornate con stato reale, backup previsto, controlli e strategia commit normale senza force push.
- 2026-05-13: risolto blocco `npm audit` senza `--force`. Aggiornato `express-rate-limit` a `^8.5.1`, con `ip-address` a `10.2.0`; `npm run audit` ora restituisce 0 vulnerabilita.
- 2026-05-13: suite completa post-fix audit: verdi `check`, `lint`, `format:check`, test unitari, `test:coverage`, build, Playwright e2e 22/22, `colli:db:check` e `audit`. Rimane solo warning PostCSS non bloccante gia noto in build.
- 2026-05-13: audit Supabase Free / Storage. Confermato che il rischio principale e egress immagini, non database o keepalive. Rimosso preload globale immagini che caricava asset CMS di pagine non visitate, mantenendo il prefetch solo su interazione utente.
- 2026-05-13: rifinito layout mobile della vetrina `/colli`: logo, testi, CTA, Instagram e indirizzo centrati solo su mobile; desktop invariato. Aggiunto controllo e2e dedicato sull'allineamento mobile.
- 2026-05-13: preparato nuovo backup operativo con convenzione `Backup_13 Maggio_22.52` e documentazione riallineata prima del commit/push su `main`.
- 2026-05-13: hotfix produzione menu Colli. Diagnosticato timeout di `https://www.cameraconvista.it/api/colli/menu`; aggiunti timeout PostgreSQL/Supabase e fallback rapido al bridge Render se la lettura snapshot resta appesa. Testato server production-like su porta 5002.
- 2026-05-13: fix definitivo runtime Colli senza DB diretto su Render. Aggiunto adapter Supabase REST server-side per menu e admin Colli quando `SUPABASE_DB_URL` non e disponibile: `/api/colli/menu` legge subito lo snapshot interno senza attendere timeout PostgreSQL, `/api/colli/admin/login` autentica senza 500 e il pannello admin legge i record `colli_*`. Verificato su porta 5003 simulando produzione senza `SUPABASE_DB_URL`: login OK, menu snapshot circa 0.46s, Playwright 22/22.
- 2026-05-14: aggiunti redirect client di compatibilita per accesso admin Colli: `/colli/admin/login` e `/colli/admina/login` portano alla rotta canonica `/colli/admina`. L'endpoint API resta `/api/colli/admin/login`.
- 2026-05-14: aggiunta install experience dedicata per `/colli/menu`. La rotta serve manifest PWA dedicato `/manifest-colli.json`, `apple-touch-icon` dedicata e icone ottimizzate `colli-home-180.png`, `colli-home-192.png`, `colli-home-512.png`, generate da `attached_assets/colli_home.png`. L'icona globale del sito resta invariata sulle altre pagine.
- 2026-05-14: consolidata gestione lingua EN Colli. Il toggle EN del pannello `/colli/admina/panel` non usa piu localStorage come fonte dati, ma l'impostazione server-side `colli_settings.english_enabled`; quando EN e disattivato, il menu pubblico `/colli/menu` forza italiano e nasconde i pulsanti `Italiano`/`English` nel menu a tendina, mantenendo visibile l'ingranaggio admin. Il cookie admin Colli e stato reso cookie di sessione browser/app, senza `Max-Age`/`Expires`.
- 2026-05-14: fix cache menu Colli in produzione. `/api/colli/menu` risponde con `Cache-Control: no-store, max-age=0` e il client `/colli/menu` rilegge il menu a ogni apertura/focus, cosi il toggle EN viene rispettato subito anche su dispositivi che avevano cache locale.
- 2026-05-14: pulizia operativa finale e backup. Rimossi solo artefatti locali rigenerabili (`dist/`, `coverage/`, `test-results/`, `playwright-report`, cache Vite), confermata suite verde (`check`, `lint`, `format:check`, `audit`, test unitari, build, e2e 25/25, `colli:db:check`) e preparato backup operativo `Backup_14 Maggio_01.55` con `.env` incluso nell'archivio locale.
