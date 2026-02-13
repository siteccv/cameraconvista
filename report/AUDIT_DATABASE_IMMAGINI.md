# report/AUDIT_DATABASE_IMMAGINI.md

## Stato Attuale
L'audit del database conferma che la migrazione dei dati è avvenuta correttamente per la tabella `page_blocks`, dove i metadati (`metadata`) contengono le nuove informazioni di overlay e i campi nativi (`image_scale_desktop`, `image_offset_x`, ecc.) sono popolati.

## Analisi Dettagliata

### 1. Coerenza Metadati ImageContainer
- **Blocchi Pagina**: I blocchi di tipo `hero`, `section`, `gallery-x` utilizzano correttamente il campo `metadata` per memorizzare `overlay` e `overlayMobile`.
- **Trasformazioni Native**: I campi `imageScaleDesktop`, `imageOffsetX`, `imageOffsetY` (e relativi mobile) sono utilizzati coerentemente da `ImageContainer`.

### 2. Anomalie e Campi Legacy
- **Tabella `events`**: Utilizza ancora i campi legacy `posterZoom`, `posterOffsetX`, `posterOffsetY`. Sebbene funzionanti, non seguono la nomenclatura standard `imageScaleDesktop` adottata per i blocchi pagina.
- **Tabella `galleries`**: Utilizza campi `coverZoom`, `coverOffsetX`, `coverOffsetY` per le copertine degli album.
- **Tabella `gallery_images`**: Utilizza campi `imageZoom`, `imageOffsetX`, `imageOffsetY`.

### 3. Persistenza Desktop vs Mobile
- La separazione dei valori è garantita nella tabella `page_blocks`.
- Nelle tabelle `events` e `galleries` NON esiste attualmente una distinzione tra posizionamento desktop e mobile (campo unico). Questo limita la precisione del cropping su dispositivi diversi per questi specifici contenuti.

## Tabelle e Campi Coinvolti
| Tabella | Campi Legacy / Incoerenti | Note |
|---------|---------------------------|------|
| `events` | `poster_zoom`, `poster_offset_x`, `poster_offset_y` | Mancano override mobile |
| `galleries` | `cover_zoom`, `cover_offset_x`, `cover_offset_y` | Mancano override mobile |
| `gallery_images` | `image_zoom`, `image_offset_x`, `image_offset_y` | Utilizzate per visualizzazione story-style |

## Rischio: Basso
L'incoerenza è puramente nominale e di precisione su mobile per eventi e gallery, ma non pregiudica il funzionamento attuale del sito.

## Proposte (Senza Implementazione)
1. **Unificazione Nomenclatura**: Rinominare i campi `zoom` in `scale` e `offset` in tutte le tabelle per coerenza con `page_blocks`.
2. **Supporto Mobile per Eventi/Gallery**: Aggiungere campi `ScaleMobile` e `OffsetMobile` alle tabelle `events` e `galleries` per permettere un cropping differenziato come già avviene per le pagine.

---
**Nessuna modifica eseguita in questa fase.**
Report pronto per la revisione.
