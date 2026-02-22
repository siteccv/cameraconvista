# Replit Agent — Valutazione readiness & piano base (Eventi Privati / SITE CCV)

## Contesto
Stiamo sviluppando la pagina **Eventi Privati** (oggi nascosta). Obiettivo: percorso guidato che genera e invia una **email classica** a **info@cameraconvista.it** con dati già filtrati. Dopo l’invio, il sito non è più coinvolto (nessun archivio/codici).

Questo documento serve a chiederti una **valutazione tecnica professionale**: siamo già pronti per partire con lo sviluppo “base” senza compromettere modularità/scalabilità? Se no, quali 2–4 fondamenta conviene fissare prima?

---

## Specifiche già definite (vincoli non negoziabili)

### 1) Entry point
- Prima schermata: **3 card principali**:
  1) Aperitivo
  2) Cena
  3) Evento Privato Esclusivo
- Click card → **pagina dedicata** (niente form diretto in home).

### 2) Pagine dedicate (UX + contenuti)
- Layout elegante, chiaro, smart; **mobile-first**.
- Devono includere **foto di riferimento** + testo informativo.
- I valori economici (minimum spending / da 4000€) devono essere **chiari prima** della CTA.
- **Fondamentale**: ogni pagina dedicata deve essere **configurabile da admin** con:
  - **sezioni modulari di testo**
  - **sezioni fotografiche**
- Codice modulare/scalabile perché le iterazioni saranno frequenti.

### 3) Contenuti di business (come vanno mostrati nelle pagine dedicate)
#### Aperitivo (informativo)
- Caso A: max 25/30 persone — Sala 1 riservata — minimum spending 1000€ (weekday) / 1500€ (ven-sab) — finger food.
- Caso B: 30/80 persone — Sala 1+2 riservate — minimum spending 1000€ (weekday) / 1500€ (ven-sab) — finger food.
- Questi range **non bloccano** l’invio del form (utente può inviare comunque).

#### Cena (standard a sedere)
- Cena classica; tavoli riservati in base al numero persone.
- **NON** riserva tutta la Sala 2.
- Pacchetti (es. 40€/persona ecc.) verranno definiti in step successivo (non ora).

#### Evento Privato Esclusivo (pagina dedicata)
- Dopo click su card “Evento Privato Esclusivo”, l’utente vede **3 opzioni**:
  1) Tavolo Convivialis — sala riservata — min 1000€ (weekday) / 1500€ (ven-sab)
  2) Riserva tutto Camera con Vista (Bistrot) — trattative da 4000€
  3) Riserva tutto Camera Jazz Club — trattative da 4000€
- Sottotitolo card principale “Evento Privato Esclusivo” da aggiornare per **suggerire elegantemente** che può essere “tutto il locale o alcune sale” (non esplicito).

### 4) Wizard (identico per tutte e 3 le card) — APPROVATO
Sequenza (7 step):
1) Riepilogo scelta (mostra tipologia; se “Evento Privato Esclusivo” mostra anche sotto-opzione: Convivialis / Riserva CCV / Riserva Jazz)
2) Quando: Data (obbl.) + Orario (obbl.) + spunta “Orario indicativo”
3) Quanti: Numero persone (obbl., campo libero) + spunta “Numero persone indicativo”
4) Dettagli: Note (facoltative)
5) Dati: Nome, Cognome, Telefono, Email (tutti obbligatori)
6) Condizioni: modale “Termini/Condizioni” + checkbox unica obbligatoria “Ho letto e accetto termini e condizioni”
7) Riepilogo finale + pulsante “Invia mail”

Regole:
- Data e orario sempre specifici (anche se “indicativi” con spunta).
- Numero persone libero; anche se >80 deve poter inviare.
- Nessun codice richiesta, nessun archivio.

### 5) Termini/Condizioni & Privacy
- Termini/Condizioni: **modale/snippet** apribile nel wizard.
- Testo sul minimum spending: **generico** (non dinamico per tipologia) e deve spiegare chiaramente:
  - è spesa minima richiesta; non extra; è ciò che verrà consumato/speso come minimo concordandolo con admin; in futuro pacchetti pronti.
- Privacy: approccio “pulito e meno invasivo” (no checkbox privacy nel wizard; al massimo link informativo dove serve).

### 6) Email (vincoli)
- Il sito deve **creare e inviare una email classica** a **info@cameraconvista.it**.
- Dopo l’invio: solo scambio email tra admin e cliente, sito fuori.
- Nessuna email automatica di conferma al cliente (conferma solo on-site).
- Email all’admin deve essere in **sezioni tabellari/blocchi** e includere sempre:
  - Tipologia + eventuale sotto-opzione (se esclusivo)
  - Data, Orario (+ indicativo sì/no)
  - Numero persone (+ indicativo sì/no)
  - Nome, Cognome, Telefono, Email
  - Note (o “nessuna nota”)

**Template email definitivo**: bozza precedente rifiutata dall’utente (“questo no”), quindi va definito in modo compatibile con i vincoli sopra.

---

## Richiesta a Replit Agent (quello che devi fare)
1) **Valuta readiness**: con queste specifiche, possiamo partire subito a implementare una base stabile?  
2) Se sì: proponi una **struttura modulare minima** (cartelle/componenti/modelli) per:
   - pagine dedicate configurabili da admin (blocchi testo/foto)
   - wizard unico parametrico
   - invio email (backend) verso Gmail
3) Se no: elenca le **2–4 fondamenta** da fissare prima (e perché), senza fare refactor pesanti dopo.
4) Suggerisci un approccio “a step” che minimizzi rischio e duplicazioni.
5) Output richiesto:
   - un file MD “REPLIT_READINESS_EVENTI_PRIVATI.md” con: diagnosi, rischi, proposta architettura minima, step 1–2–3 implementativi.

---

## Nota di governance
- Evitare soluzioni parallele/duplicate. Una sola implementazione canonica.
- Preferire moduli piccoli, riusabili, senza file monolitici.
