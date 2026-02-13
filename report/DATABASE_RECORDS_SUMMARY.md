# Riepilogo Record Database - Camera con Vista CMS

**Data report:** 13 Febbraio 2026

## 📊 Statistiche Generali

| Tabella | Conteggio Record | Descrizione |
|---------|------------------|-------------|
| `pages` | 8 | Pagine strutturali del sito (Home, Menu, Vini, etc.) |
| `page_blocks` | 0 | Blocchi di contenuto dinamico (Hero, Intro, etc.) |
| `menu_items` | 23 | Piatti del ristorante sincronizzati da Google Sheets |
| `wines` | 66 | Etichette della cantina sincronizzate da Google Sheets |
| `cocktails` | 31 | Drink del cocktail bar sincronizzati da Google Sheets |
| `events` | 4 | Eventi in programma gestiti da Admin |
| `media` | 0 | File caricati nella libreria media |
| `media_categories` | 2 | Categorie per l'organizzazione dei media |
| `galleries` | 4 | Album fotografici |
| `gallery_images` | 20 | Immagini contenute negli album |
| `site_settings` | 2 | Configurazioni globali (SEO, Google Sheets URL) |

---

## 📄 Dettaglio Pagine (`pages`)
- **Home**: `/` (Priorità 1.0)
- **Menu**: `/menu`
- **Carta dei Vini**: `/lista-vini`
- **Cocktail Bar**: `/cocktail-bar`
- **Eventi**: `/eventi`
- **Eventi Privati**: `/eventi-privati`
- **Galleria**: `/galleria`
- **Dove Siamo**: `/dove-siamo`

---

## 🍷 Sincronizzazione Google Sheets
- **Vini**: 66 record suddivisi in 6 categorie (Bollicine Italiane/Francesi, Bianchi, Rossi, Rosati, Vini Dolci).
- **Menu**: 23 record (Antipasti, Primi, Secondi, Dolci).
- **Cocktail**: 31 record (Signature, Classici, Analcolici).

---

## 📅 Eventi in Programma
Attualmente sono presenti **4 eventi attivi** configurati con poster in formato 9:16 e sistema di prenotazione integrato.

---

## 🖼️ Galleria Fotografica
- **Album totali**: 4
- **Immagini totali**: 20 (Media di 5 immagini per album)

---

## 🛠️ Note Tecniche
I record `page_blocks` risultano 0 nel conteggio SQL diretto poiché molti blocchi vengono generati "just-in-time" dal frontend tramite il hook `usePageBlocks` basandosi sui default se non modificati. I file media fisici sono ospitati su Object Storage, mentre i metadati nel database verranno popolati al primo caricamento tramite la UI Admin.
