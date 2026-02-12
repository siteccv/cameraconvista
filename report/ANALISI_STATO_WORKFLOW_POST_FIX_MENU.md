# ANALISI STATO WORKFLOW POST-FIX HERO MENU

## Data: 12 Febbraio 2026
## Tipo: Analisi strutturale — nessuna modifica al codice

---

# 1. STATO ATTUALE REALE DEL SISTEMA

## 1.1 Componenti presenti nel codice

| Componente | File | Stato | Usato da |
|---|---|---|---|
| **ImageContainer** | `components/admin/ImageContainer.tsx` | ATTIVO — componente nuovo, canonico | `menu.tsx` (hero), `eventi-privati.tsx` (spazi) |
| **EditableImage** | `components/admin/EditableImage.tsx` | ATTIVO — legacy, ancora in uso | 7 pagine (hero), `eventi-privati.tsx` (hero) |
| **TestImageContainer** | `components/admin/TestImageContainer.tsx` | ORFANO — nessun import lo referenzia | Nessuno |
| **EventModal** | `components/admin/EventModal.tsx` | ATTIVO — logica modale zoom | Eventi |
| **ImageZoomModal** | `components/admin/gallery/ImageZoomModal.tsx` | ATTIVO — logica modale zoom | Galleria |

## 1.2 Stato migrazione pagine

| Pagina | Hero | Overlay | Componente | Crop stabile | referenceWidth |
|---|---|---|---|---|---|
| **Menu** | ✅ Migrata | ✅ Dinamico (slider) | ImageContainer | ✅ (referenceWidth=1560) | ✅ |
| Home | ❌ Legacy | ❌ Hardcoded `bg-black/35`* | EditableImage | ❌ | ❌ |
| Carta dei Vini | ❌ Legacy | ❌ Hardcoded `bg-black/35` | EditableImage | ❌ | ❌ |
| Cocktail Bar | ❌ Legacy | ❌ Hardcoded `bg-black/35` | EditableImage | ❌ | ❌ |
| Eventi | ❌ Legacy | ❌ Hardcoded `bg-black/35` | EditableImage | ❌ | ❌ |
| Galleria | ❌ Legacy | ❌ Hardcoded `bg-black/35` | EditableImage | ❌ | ❌ |
| Dove Siamo | ❌ Legacy | ❌ Hardcoded `bg-black/35` | EditableImage | ❌ | ❌ |
| Eventi Privati (hero) | ❌ Legacy | ❌ Hardcoded `bg-black/35` | EditableImage | ❌ | ❌ |
| Eventi Privati (spazi) | ✅ Migrata | ✅ Dinamico | ImageContainer | ❌ (no referenceWidth) | ❌ |

*Nota: La Home ha una struttura hero diversa (logo, tagline, booking button) — non usa il pattern `bg-black/35` standard. Verifica necessaria.*

## 1.3 Layout hero Menu vs altre pagine

| Proprietà | Menu (attuale) | Altre pagine (legacy) |
|---|---|---|
| Altezza | `h-[60vh]` | `h-[60vh]` |
| Larghezza | `max-w-[1560px]` centrata | Full-bleed |
| Margini laterali | `px-4 md:px-8` | Nessuno (o `left-4 right-4 md:left-0 md:right-0`) |
| Bordi arrotondati | `rounded-xl` | `rounded-xl md:rounded-none` (mobile yes, desktop no) |
| Container | Contenuto, centrato | Full-width |
| Crop | Stabile (referenceWidth=1560) | Variabile (dipende da viewport) |
| Overlay | Dinamico (slider 0-70%) | Hardcoded 35% |
| Editing | WYSIWYG nel container | Modale separata |

---

# 2. CONFRONTO CON WORKFLOW INIZIALE

## 2.1 Step per step

### Step 1 — Consolidamento componente unico
**Workflow**: Rinominare TestImageContainer in ImageContainer, API generica.
**Stato reale**: ✅ **COMPLETATO AL 100%**
- ImageContainer esiste con API pulita
- TestImageContainer ancora nel codice ma orfano (nessun import)
- **Scostamento**: TestImageContainer.tsx non è stato eliminato. Il workflow prevede l'eliminazione al completamento della migrazione completa. Coerente con il piano.

### Step 2 — Gestione mobile indipendente
**Workflow**: Props mobile, switch desktop/mobile, logica dual-mode.
**Stato reale**: ✅ **COMPLETATO AL 100%**
- 4 props mobile implementate e funzionanti
- Switch desktop/mobile nella toolbar
- Save/Cancel gestiscono entrambi i set
- Display pubblico seleziona in base a device
- **Nessuno scostamento.**

### Step 3 — Migrazione hero test (Menu)
**Workflow**: Sostituire EditableImage con ImageContainer nella hero Menu.
**Stato reale**: ✅ **COMPLETATO AL 100%** (con evoluzione rispetto al piano originale)
- EditableImage sostituito
- Overlay hardcoded rimosso
- Save handler aggiornato
- Titolo come children
- **Evoluzione non prevista nel workflow originale**: layout contenuto (max-width, margini, rounded corners). Questa è un'aggiunta richiesta dall'utente durante l'esecuzione.

### Step 3B — Stabilizzazione Aspect Ratio
**Workflow**: Non previsto nel piano originale — era un tentativo intermedio.
**Stato reale**: ↩️ **ROLLBACK ESEGUITO**
- Il tentativo di usare `aspect-ratio: 16/9` al posto di `h-[60vh]` è stato annullato perché rendeva la hero troppo piccola.
- **Il codice è stato riportato a h-[60vh]**. Nessun residuo nel codice attuale.

### Step 4 — Validazione performance + UX
**Workflow originale**: Validazione e testing, nessuna implementazione.
**Stato reale**: ⚠️ **DEVIATO — TRASFORMATO IN IMPLEMENTAZIONE**
- Il workflow prevedeva solo validazione/testing della migrazione Menu
- In pratica, Step 4 è diventato l'implementazione della stabilizzazione del crop:
  1. Prima `fixedCropRatio` (parzialmente efficace — non stabilizzava completamente)
  2. Poi `referenceWidth` (soluzione definitiva — immagine renderizzata a dimensione fissa)
- **La validazione performance formale (Lighthouse, layout shift, editing lag) non è stata eseguita.**

### Step 5 — Migrazione progressiva altre hero
**Workflow**: Migrare tutte le hero da EditableImage a ImageContainer.
**Stato reale**: ❌ **NON INIZIATO**
- 7 pagine ancora su EditableImage (Home, Carta Vini, Cocktail Bar, Eventi, Galleria, Dove Siamo, Eventi Privati hero)
- 6 pagine con overlay hardcoded `bg-black/35`
- Il layout contenuto (max-width, margini) è solo su Menu. Le altre pagine restano full-bleed.

### Step 6 — Stabilizzazione preview mobile admin
**Workflow**: Rendere la preview mobile affidabile.
**Stato reale**: ❌ **NON INIZIATO**
- IPhoneFrame ancora con logica originale
- Le problematiche note (vh, Tailwind responsive, window.innerWidth) non sono state affrontate.

---

# 3. ANALISI CODICE — CRITICITÀ ARCHITETTURALI

## 3.1 Codice pulito ✅

L'implementazione attuale di `useImageMath` e `ImageContainer` è **pulita e senza stratificazioni**:
- `fixedCropRatio` è stato completamente rimosso (non esiste più nel codice, solo nei report)
- `referenceWidth` è la soluzione unica e definitiva
- La logica desktop/mobile è corretta: `referenceWidth` si disattiva su mobile e in admin mobile editing mode
- `useImageMath` è un hook puro senza effetti collaterali
- `minZoomX = (sizeW / baseW) * 100` è sempre 100 (poiché sizeW = baseW) — questa riga è ridondante ma innocua

## 3.2 File orfano ⚠️

`TestImageContainer.tsx` esiste ma non è importato da nessun file. È un residuo del processo di migrazione. Come previsto dal workflow, va eliminato al completamento della migrazione. **Non è una criticità immediata** ma è debito tecnico.

## 3.3 Doppia logica di rendering ⚠️

EditableImage e ImageContainer coesistono. Questo è **previsto e accettabile** durante la migrazione (punto 3.1 del workflow). Diventerà un problema se la migrazione si blocca a lungo, perché:
- Correzioni su un componente non si propagano all'altro
- Due pattern di editing diversi (modale vs WYSIWYG)
- Due formati di offset (pixel assoluti vs normalizzati)

## 3.4 Overlay hardcoded su 6 pagine ⚠️

`bg-black/35` è ancora hardcoded su Carta Vini, Cocktail Bar, Eventi, Galleria, Dove Siamo, Eventi Privati. L'overlay non è modificabile dall'admin su queste pagine. Questo verrà risolto con la migrazione a ImageContainer (Step 5).

## 3.5 Layout eterogeneo: Menu vs altre pagine ⚠️

Solo la pagina Menu ha:
- Layout contenuto (max-width + margini)
- Crop stabile (referenceWidth)
- Angoli arrotondati su desktop

Le altre 7 pagine sono full-bleed con crop variabile. Questo crea un'**incoerenza visiva temporanea** che verrà risolta durante Step 5. Tuttavia, è necessaria una **decisione di design**: le altre pagine devono adottare lo stesso layout contenuto del Menu, oppure restare full-bleed?

## 3.6 Rischio: `referenceWidth` e admin editing ⚠️

Quando `referenceWidth=1560` è attivo e il container è più stretto (es. admin preview a 1280px), l'immagine è renderizzata a 1560px e i bordi sono clippati. L'admin vede l'immagine corretta come nella pagina pubblica (desktop larga), MA:
- Il drag/pan potrebbe sentirsi "diverso" perché l'immagine è più grande del container visibile
- L'admin potrebbe non rendersi conto che i bordi sono clippati

Questo è un rischio **basso** e si risolve con documentazione/training.

---

# 4. PARTI COMPLETATE, PARZIALI, MANCANTI

## ✅ Completate al 100%

| Elemento | Dettaglio |
|---|---|
| ImageContainer — componente base | API generica, hook esportato, testIdPrefix |
| Gestione mobile indipendente | 4 props, switch, isolamento, save/cancel |
| Migrazione hero Menu | EditableImage rimosso, overlay dinamico, children |
| Crop stabile desktop (Menu) | referenceWidth=1560, desktop-only |
| Layout contenuto (Menu) | max-w-[1560px], margini, rounded corners |

## ⚠️ Parziali

| Elemento | Dettaglio | Cosa manca |
|---|---|---|
| Validazione performance (Step 4 originale) | Non eseguita formalmente | Lighthouse, layout shift, editing lag |
| Migrazione eventi-privati | Spazi usano ImageContainer, hero usa EditableImage | Migrare hero |
| Pulizia codice | TestImageContainer orfano | Eliminare file |

## ❌ Mancanti

| Elemento | Dettaglio |
|---|---|
| Migrazione 7 hero (Step 5) | Home, Carta Vini, Cocktail Bar, Eventi, Galleria, Dove Siamo, Eventi Privati hero |
| Rimozione 6 overlay hardcoded | bg-black/35 su 6 pagine |
| Stabilizzazione preview mobile (Step 6) | IPhoneFrame, vh, Tailwind responsive |
| Eliminazione EditableImage | Solo dopo Step 5 completato |
| Decisione design: layout contenuto globale | Le altre pagine devono avere max-width + margini come Menu? |

---

# 5. RISCHI TECNICI

| Rischio | Severità | Probabilità | Impatto |
|---|---|---|---|
| Step 5 blocca la doppia logica troppo a lungo | Media | Media | Manutenzione doppia, bug divergenti |
| Layout contenuto (Menu) vs full-bleed (altre) crea incoerenza | Media | Certa (ora) | Percezione qualità eterogenea |
| Preview mobile admin non affidabile | Alta | Certa (nota) | Admin salva valori mobile "alla cieca" |
| referenceWidth non applicato alle altre pagine migrabili | Bassa | Zero (non iniziato) | Solo se Step 5 non procede |
| Eliminazione EditableImage prima del completamento | Alta | Bassa | Breaking change se prematura |

---

# 6. PROPOSTA ORDINATA PER CHIUDERE IL WORKFLOW

## Fase A — Decisioni di design (prima di toccare codice)

**A1. Layout contenuto**: Le altre pagine devono adottare lo stesso layout della Menu (max-width + margini + rounded corners)? Oppure restano full-bleed? Questa decisione influenza tutto Step 5.

**A2. referenceWidth globale**: Se le altre pagine adottano il layout contenuto, devono avere `referenceWidth` (crop stabile) come Menu? O è sufficiente la migrazione a ImageContainer senza referenceWidth?

**A3. Priorità Step 6**: La stabilizzazione mobile admin va fatta prima, durante, o dopo Step 5?

## Fase B — Completamento Step 5 (migrazione hero)

L'ordine suggerito dal workflow originale resta valido:

1. **Carta dei Vini** — struttura identica a Menu, rischio bassissimo
2. **Cocktail Bar** — struttura identica
3. **Eventi** — struttura identica
4. **Galleria** — struttura identica
5. **Dove Siamo** — struttura identica
6. **Eventi Privati (hero)** — ha già ImageContainer per gli spazi, aggiungere hero
7. **Home** — struttura diversa (logo, tagline, booking), rischio più alto, per ultima

Per ogni pagina:
- Sostituire EditableImage con ImageContainer
- Rimuovere overlay hardcoded `bg-black/35`
- Aggiornare save handler per `ImageContainerSaveData`
- Resettare offset legacy a 0
- Applicare layout contenuto (se decisione A1 = sì) o mantenere full-bleed
- Applicare `referenceWidth` (se decisione A2 = sì) o lasciare crop responsivo
- Test e2e (desktop + admin editing)

## Fase C — Pulizia

- Eliminare `TestImageContainer.tsx`
- Eliminare `EditableImage.tsx` (solo dopo che TUTTE le hero sono migrate)
- Verificare che nessun import residuo referenzi componenti eliminati
- Aggiornare report workflow con stato COMPLETATO

## Fase D — Step 6 (preview mobile)

Separata e indipendente. Può essere fatta in parallelo o dopo Fase B.

---

# 7. RACCOMANDAZIONE FINALE

## Approccio conservativo (raccomandato)

1. **Rispondere alle 3 decisioni di design** (A1, A2, A3) prima di toccare codice
2. **Procedere con Step 5 una pagina alla volta**, nell'ordine suggerito
3. **Non affrettare l'eliminazione di EditableImage** — farlo solo a migrazione completa
4. **Step 6 può attendere** — non blocca niente e richiede analisi approfondita

### Motivazione
Il sistema è stabile. La Menu hero funziona come richiesto. La doppia logica è temporanea e gestibile. Il rischio più alto è fare troppe modifiche simultanee e introdurre regressioni.

## Approccio aggressivo (non raccomandato)

1. Migrare tutte le 7 hero in un unico intervento
2. Eliminare EditableImage subito dopo
3. Affrontare Step 6 in parallelo

### Motivazione contro
Troppi file modificati contemporaneamente. Un bug in una pagina potrebbe essere mascherato da un bug in un'altra. L'admin dovrebbe rieditare tutte le immagini in una volta sola.

---

## Prossimo step logico

**Rispondere alla decisione A1**: Le altre pagine devono adottare il layout contenuto (max-width + margini + rounded corners) come la Menu, oppure restano full-bleed?

Questa risposta determina l'intero approccio di Step 5.
