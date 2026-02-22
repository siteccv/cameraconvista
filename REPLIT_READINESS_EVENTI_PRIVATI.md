# Replit Agent — Valutazione Readiness: Eventi Privati

## 1. Diagnosi & Valutazione (Readiness: 95%)
Siamo pronti per partire. L'architettura attuale del progetto (basata su `PageBlocks`) è perfettamente compatibile con la modularità richiesta. Non servono refactor pesanti, ma solo un'estensione del modello dati esistente per gestire il wizard e le nuove sottopagine.

### Rischi Identificati:
- **Duplicazione Logica Wizard**: Il wizard deve essere un componente unico "headless" o parametrico per evitare di riscrivere la logica 3 volte.
- **Configurazione Admin**: Dobbiamo assicurarci che i nuovi blocchi (min spending, foto gallery dedicata) siano mappati correttamente nel sistema di editing WYSIWYG esistente.
- **Invio Email**: Richiede configurazione SMTP (Gmail) tramite segreti Replit per evitare blocchi di spam.

---

## 2. Struttura Modulare Proposta

### Frontend (`client/src/`)
- `pages/eventi-privati/index.tsx`: La landing con le 3 card (già parzialmente implementata).
- `pages/eventi-privati/[type].tsx`: Pagina dinamica per Aperitivo, Cena, Esclusivo.
- `components/eventi/EventWizard.tsx`: Componente a 7 step, riceve `type` e `config` come props.
- `hooks/use-event-request.ts`: Gestisce lo stato del wizard e la chiamata API finale.

### Backend (`server/`)
- `routes/email.ts`: Endpoint POST `/api/events/request` che valida i dati e usa Nodemailer.
- `lib/email-templates.ts`: Generatore di HTML tabellare per l'admin.

### Database (`shared/schema.ts`)
- Estensione `page_blocks` o nuovi tipi di blocco per gestire i metadati specifici (es. `min_spending_weekday`, `min_spending_weekend`).

---

## 3. Piano Implementativo Step-by-Step

### Step 1: Fondamenta Dati & Routing
- Configurare le rotte dinamiche in `App.tsx`.
- Aggiungere i default per le nuove pagine in `page-defaults.ts`.
- Definire lo schema di validazione Zod per il form.

### Step 2: UI & Wizard
- Creare il componente `EventWizard` con i 7 step approvati.
- Implementare le pagine di dettaglio con i blocchi `EditableText` e `ImageContainer` per la massima autonomia dell'admin.

### Step 3: Integrazione Email
- Configurare il trasporto Nodemailer nel backend.
- Testare il template email tabellare inviando a `info@cameraconvista.it`.

---

## 4. Prossimo Step Consigliato
Procedere con lo **Step 1** (Setup rotte e dati) per sbloccare la creazione delle pagine di dettaglio.
