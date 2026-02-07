# 06 - Pannello Admin

## Accesso

- **URL**: `/admina` (path segreto, non esposto nella navigazione pubblica)
- **Password default**: `1909`
- **Sessione**: Cookie httpOnly, durata 24 ore
- **Logout**: Invalida sessione su server + clear cookie

## Layout Admin

Sidebar a sinistra (256px) con 7 sezioni di navigazione + 3 azioni:

### Navigazione
| Icona | Voce IT | Voce EN | Path |
|-------|---------|---------|------|
| FileText | Sezioni Pagine | Page Sections | `/admina` |
| Calendar | Eventi | Events | `/admina/events` |
| Images | Galleria Album | Album Gallery | `/admina/gallery` |
| Image | Libreria Media | Media Library | `/admina/media` |
| Eye | Anteprima | Preview | `/admina/preview` |
| Search | SEO & Metadata | SEO & Metadata | `/admina/seo` |
| Settings | Impostazioni | Settings | `/admina/settings` |

### Azioni Sidebar
1. **Pubblica Sito** — Pulsante con 3 stati:
   - Rosso pulsante (`animate-subtle-pulse`): ci sono modifiche non pubblicate
   - Verde: tutto aggiornato
   - Loading: verifica in corso
2. **Vedi Sito** — Apre il sito pubblico in nuova tab
3. **Esci** — Logout

## Sezioni Pagine (`/admina`)

### Funzionalità
- Lista di tutte le pagine del sito
- Per ogni pagina: nome, visibilità, stato draft/published
- Toggle visibilità (tranne Home che non può essere nascosta)
- Click → modifica blocchi della pagina

### Blocchi Pagina
Ogni pagina è composta da blocchi (`pageBlocks`):
- `hero` — Immagine hero con titolo sovrapposto
- `intro` — Testo introduttivo sotto il hero
- `section` — Sezione di contenuto generico
- `cta` — Call to action
- Custom block types definiti nel metadata

### Editing WYSIWYG
In modalità admin preview:
- `EditableText`: Click su qualsiasi testo → campo inline editabile
- `EditableImage`: Click su qualsiasi immagine → MediaPickerModal + controlli zoom/offset
- Le modifiche vengono salvate automaticamente via API

## Eventi (`/admina/events`)

### Funzionalità
- Lista eventi con drag-and-drop per riordino
- Max 10 eventi contemporanei
- Creazione/modifica via `EventModal`

### Campi Evento
| Campo | Tipo | Descrizione |
|-------|------|-------------|
| titleIt/En | text | Titolo bilingue |
| descriptionIt/En | text | Descrizione breve |
| detailsIt/En | text | Dettagli completi |
| posterUrl | text | URL poster immagine |
| posterZoom/OffsetX/OffsetY | integer | Posizionamento poster |
| startAt | timestamp | Data/ora inizio |
| active | boolean | Attivo/inattivo |
| bookingEnabled | boolean | Prenotazione abilitata |
| bookingUrl | text | URL prenotazione |
| visibilityMode | enum | ACTIVE_ONLY o UNTIL_DAYS_AFTER |
| visibilityDaysAfter | integer | Giorni dopo evento per nascondere |

## Galleria Album (`/admina/gallery`)

### Funzionalità
- Lista album con copertine
- Creazione album via `GalleryModal`
- Gestione immagini album via `AlbumImagesModal`
- Riordino drag-and-drop
- Zoom/offset per ogni immagine individualmente

### Flow Creazione Album
1. Click "Nuovo Album"
2. `GalleryModal`: inserire titolo IT/EN
3. Selezionare copertina da MediaPickerModal
4. Configurare zoom/offset copertina
5. Salva → album creato
6. Aprire album → `AlbumImagesModal`
7. Aggiungere immagini da MediaPickerModal
8. Riordinare con drag-and-drop
9. Configurare zoom/offset per ogni immagine

## Libreria Media (`/admina/media`)

### Funzionalità
- Griglia immagini uploadate
- Filtro per categoria/cartella
- Upload nuove immagini (max 20MB)
- Dettagli immagine: alt text IT/EN, categoria, dimensioni
- Gestione cartelle/categorie

### Upload Flow
1. Selezionare file → upload via Object Storage (presigned URL)
2. Processamento opzionale con sharp (resize)
3. Salvataggio metadata in database
4. Immagine disponibile per selezione in MediaPickerModal

### Categorie Media
- CRUD completo via `ManageCategoriesModal`
- Campi: slug, labelIt, labelEn, sortOrder
- Immagini uploadate assegnate alla categoria selezionata

## Anteprima (`/admina/preview`)

### Funzionalità
- Preview mobile in frame iPhone 15 Pro
- Navigazione tra le pagine del sito
- Editing WYSIWYG attivo nel preview
- Toggle desktop/mobile view

### IPhoneFrame
- Dimensioni: 393x771px (area visibile)
- 393px larghezza logica iPhone 15 Pro, 771px = 852 - 47 (status bar) - 34 (home indicator)
- Altezza adattiva al container, minimo 600px
- `forceMobileLayout` forzato per tutti i componenti figli

## SEO & Metadata (`/admina/seo`)

### Funzionalità
- Per ogni pagina: meta title IT/EN, meta description IT/EN
- Campi: `metaTitleIt`, `metaTitleEn`, `metaDescriptionIt`, `metaDescriptionEn`
- Salvati nella tabella `pages`

## Impostazioni (`/admina/settings`)

### Funzionalità
1. **Cambio Password**: Password corrente + nuova password (min 4 caratteri)
2. **Footer Settings**: Form completo per tutti i contenuti del footer
   - About text IT/EN
   - Contatti (indirizzo, telefono, email)
   - Orari di apertura (giorni selezionabili, orari, chiuso/aperto)
   - Social links (tipo + URL)
   - Link legali (privacy, cookie)

## Workflow di Pubblicazione

```
Admin modifica contenuto
        │
        ▼
isDraft = true (pulsante diventa rosso)
        │
        ▼
Admin clicca "Pubblica Sito"
        │
        ▼
Per ogni pagina e blocco:
  - snapshot corrente → publishedSnapshot
  - isDraft = false
  - publishedAt = now
        │
        ▼
Pulsante diventa verde "Tutto aggiornato"
Sito pubblico aggiornato
```
