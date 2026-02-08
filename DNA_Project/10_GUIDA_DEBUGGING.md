# 10 - Guida al Debugging

## Problemi Comuni e Soluzioni

### 1. Sequenze ID Fuori Sync (Supabase)

**Sintomo**: Errore `duplicate key value violates unique constraint` durante INSERT.

**Causa**: Le sequenze PostgreSQL (`galleries_id_seq`, `gallery_images_id_seq`, etc.) non sono allineate con il MAX(id) nella tabella, tipicamente dopo import dati o manipolazioni manuali.

**Soluzione implementata** (in `supabase-storage.ts`):
```typescript
// Fetch MAX(id) e inserisci con id esplicito
const { data: maxResult } = await supabaseAdmin
  .from('table_name')
  .select('id')
  .order('id', { ascending: false })
  .limit(1);
const nextId = (maxResult?.[0]?.id || 0) + 1;
// Insert con id: nextId
```

**Soluzione alternativa SQL**:
```sql
SELECT setval('galleries_id_seq', (SELECT COALESCE(MAX(id), 0) FROM galleries));
```

### 2. Draft/Publish Non Funziona

**Sintomo**: Le modifiche admin non appaiono sul sito pubblico dopo "Pubblica".

**Debug steps**:
1. Verificare che il pulsante "Pubblica Sito" sia rosso (ci sono modifiche pending)
2. Controllare la risposta di `POST /api/admin/publish-all`
3. Verificare che `publishedSnapshot` sia popolato nei blocchi:
   ```sql
   SELECT id, block_type, is_draft, published_snapshot FROM page_blocks WHERE page_id = X;
   ```
4. Verificare che la route pubblica applichi `applyPublishedSnapshot`:
   - `GET /api/pages/:pageId/blocks` deve mappare con `applyPublishedSnapshot`

**Causa comune**: Blocchi creati senza snapshot iniziale. Fix: creare blocco → immediatamente fare publish.

### 3. Sessione Admin Scaduta / Loop Login

**Sintomo**: Login riuscito ma redirect immediato a login.

**Debug steps**:
1. Verificare che il cookie `ccv_admin_session` sia presente nel browser
2. Controllare che la sessione esista in DB:
   ```sql
   SELECT * FROM admin_sessions WHERE id = 'token_value';
   ```
3. Verificare che `expires_at > NOW()`:
   ```sql
   SELECT *, (expires_at > NOW()) as valid FROM admin_sessions;
   ```
4. Controllare `sameSite` e `secure` flags del cookie
5. In dev: `secure: false`, in prod: `secure: true`

### 4. Immagini Non Visualizzate

**Sintomo**: Immagini rotte o placeholder vuoti.

**Debug steps**:
1. Verificare URL nel database:
   ```sql
   SELECT url FROM media WHERE id = X;
   ```
2. Testare l'URL direttamente nel browser
3. Verificare che Object Storage sia configurato:
   - `DEFAULT_OBJECT_STORAGE_BUCKET_ID` deve essere impostato
4. Controllare CORS se l'immagine è su dominio diverso
5. Per immagini con zoom/offset: verificare i valori nel DB non siano corrotti

### 5. Traduzioni Mancanti

**Sintomo**: Testo mostrato nella lingua sbagliata o vuoto.

**Debug steps**:
1. Verificare il valore di `language` nel LanguageContext
2. Controllare che entrambi i campi (IT e EN) siano popolati nel DB:
   ```sql
   SELECT title_it, title_en FROM pages WHERE slug = 'home';
   ```
3. Il fallback `t(it, en)` ritorna: se EN → `en || it || ""`; se IT → `it || en || ""`
4. Se il campo è `null` in entrambe le lingue → stringa vuota

### 6. Upload Media Fallisce

**Sintomo**: Errore durante upload file.

**Debug steps**:
1. Verificare dimensione file (max 20MB)
2. Controllare che Object Storage sia configurato (secrets presenti)
3. Verificare log server per errori presigned URL
4. Controllare permessi bucket GCS
5. Verificare che `multer` sia configurato con `memoryStorage`

### 7. Blocchi Pagina Duplicati

**Sintomo**: Stessi contenuti ripetuti sulla pagina.

**Causa**: `usePageBlocks` crea blocchi default se non ne trova. Se il fetch fallisce temporaneamente, può creare duplicati.

**Soluzione**:
1. Usare l'endpoint cleanup: `POST /api/admin/cleanup-duplicates`
2. Oppure manualmente:
   ```sql
   -- Trova duplicati per pagina
   SELECT page_id, block_type, COUNT(*) FROM page_blocks 
   GROUP BY page_id, block_type HAVING COUNT(*) > 1;
   
   -- Elimina duplicati (mantieni il più recente)
   DELETE FROM page_blocks WHERE id IN (
     SELECT id FROM (
       SELECT id, ROW_NUMBER() OVER (PARTITION BY page_id, block_type ORDER BY id DESC) as rn
       FROM page_blocks
     ) t WHERE rn > 1
   );
   ```

### 8. Font Size Non Aggiornata

**Sintomo**: Cambio font size in admin non si riflette nel rendering.

**Debug steps**:
1. Verificare che la modifica sia per il device corretto:
   - Desktop: `titleFontSize`, `bodyFontSize`
   - Mobile: `titleFontSizeMobile`, `bodyFontSizeMobile`
2. Controllare `deviceView` in AdminContext
3. Verificare che `forceMobileLayout` sia sincronizzato con `deviceView`
4. Il valore default è: titolo desktop 48px, mobile 32px; body desktop 16px, mobile 14px

### 9. Supabase vs PostgreSQL Diretto Switching

**Sintomo**: Errori dopo switch tra backend.

**Debug steps**:
1. Verificare le variabili d'ambiente:
   - Supabase: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` tutte presenti
   - PostgreSQL diretto: `DATABASE_URL` presente
   - Se nessuna variabile presente: il server si arresta con errore esplicito
2. Se switch da Supabase a PostgreSQL diretto: assicurarsi che lo schema locale sia aggiornato (`npm run db:push`)
3. Se switch da PostgreSQL diretto a Supabase: verificare che le tabelle Supabase abbiano tutte le colonne
4. Controllare log server per conferma: "Using Supabase as database backend" vs "Using PostgreSQL (Drizzle) as database backend"

### 11. Problemi di Portabilità (Windsurf / Locale)

**Sintomo**: App non parte o API rispondono 304 fuori da Replit.

**Verifiche**:
1. **reusePort**: Rimosso dal progetto. Se presente per errore → `ENOTSUP` su macOS/Windows
2. **ETag 304**: In dev, ETag è disabilitato per `/api/*`. Verificare che `NODE_ENV=development`
3. **Plugin Replit**: Gated da `REPL_ID`. Fuori Replit vengono saltati automaticamente
4. **Variabili env**: Servono almeno `DATABASE_URL` o `SUPABASE_URL`+`SUPABASE_SERVICE_ROLE_KEY`
5. **Porta**: Default 5000, configurabile con `PORT=XXXX`

### 10. Errore "Vite manifest not found"

**Sintomo**: Errore in produzione, pagina bianca.

**Causa**: Build non completata o file mancanti.

**Soluzione**:
1. Rieseguire `npm run build`
2. Verificare che `dist/public/` contenga i file compilati
3. Verificare che `dist/index.cjs` esista
4. Non modificare mai `vite.config.ts` o `server/vite.ts`

## Strumenti di Debug

### Log Server
- Tutte le API calls sono loggate con timing: `METHOD /path STATUS in Xms`
- Errori loggati con `console.error`
- Formato: `HH:MM:SS AM/PM [express] message`

### Database Queries
- Usare `execute_sql_tool` per query dirette
- Non usare `psql` da bash (non disponibile)
- Query utili:
  ```sql
  -- Stato pagine
  SELECT slug, is_draft, is_visible, published_at FROM pages;
  
  -- Blocchi con snapshot
  SELECT id, page_id, block_type, is_draft, 
         (published_snapshot IS NOT NULL) as has_snapshot 
  FROM page_blocks ORDER BY page_id, sort_order;
  
  -- Sessioni attive
  SELECT id, expires_at, (expires_at > NOW()) as valid FROM admin_sessions;
  
  -- Media per categoria
  SELECT category, COUNT(*) FROM media GROUP BY category;
  ```

### Browser DevTools
- Network tab: verificare API calls e risposte
- Application → Cookies: verificare `ccv_admin_session`
- Console: errori React Query, rendering issues
- localStorage: `ccv_language` per lingua corrente

## Regole di Sicurezza

1. **MAI** cambiare tipo colonne ID (serial ↔ varchar) → causa migration failure
2. **MAI** eseguire SQL distruttivo (DROP, DELETE senza WHERE) senza conferma
3. **MAI** esporre secrets o API keys nei log
4. **MAI** modificare `vite.config.ts`, `server/vite.ts`, `drizzle.config.ts`
5. **MAI** modificare `package.json` direttamente (usare packager tool)
6. Usare `npm run db:push --force` per sync schema, non migrazioni manuali

## Checklist Pre-Deploy

1. [ ] Tutte le pagine pubbliche funzionano
2. [ ] Login admin funziona
3. [ ] Draft/Publish funziona (modificare → pubblicare → verificare sito pubblico)
4. [ ] Upload media funziona
5. [ ] Bilinguismo IT/EN funziona su tutte le pagine
6. [ ] Responsive mobile funziona
7. [ ] Gallery viewer funziona (swipe mobile, frecce desktop)
8. [ ] Eventi con date formattate correttamente
9. [ ] Footer mostra dati dal database
10. [ ] Cookie consent appare
