# RIPARTI DA QUI — Handoff sessione (cambio PC)

> Scopo: riprendere il lavoro su un **altro PC, in una chat nuova**, senza storico.
> Questo file è **self-contained** e **senza segreti**. La memoria agent di questa
> sessione vive in `~/.claude/...` e **NON si trasferisce**: la fonte di verità per
> ripartire è QUESTO file + il codice reale + `README_OPERATIVO.md` + `DNA/`.
>
> Ultimo aggiornamento: **2026-06-14**.

---

## 0) VINCOLO FONDAMENTALE (non negoziabile)

Il sito è **LIVE in produzione** in ogni sezione (pagine, admin, Colli, sync, Supabase).
**Si può analizzare e migliorare, ma NON si deve MAI compromettere dati, logiche, funzioni o sync.**
- Niente scritture persistenti/distruttive su DB, schema, deploy, UI senza richiesta esplicita.
- Niente `drizzle-kit push` / sync schema su produzione (additivo e manuale, solo su richiesta).
- Niente email reali, sync o push senza richiesta esplicita.
- L'unica scrittura DB ammessa in autonomia è una **prova transazionale con ROLLBACK** (non persiste).

---

## 1) Stack & ambiente (verificato)

- App: **Express 5 + React/Vite**, **Drizzle ORM** su **Supabase Postgres** (PG 17.6).
- Hosting: **Render** (servizio `cameraconvista`, id `srv-d61pes7gi27c73espbcg`, region frankfurt).
- Email: **Resend** (solo per le richieste eventi — vedi §4).
- Repo GitHub: `https://github.com/siteccv/cameraconvista` (PUBBLICO), branch `main`, remote `github`.
- CLI presenti su questo PC: node 22, npm, pnpm, gh, git, psql 18, docker.
- Porta dev locale standard: `PORT=5001 npm run dev`.

### ⚠️ AUTODEPLOY ATTIVO
Render ha **autoDeploy = yes su `main`**: **ogni `git push` su main = deploy in PRODUZIONE.**
→ Trattare qualsiasi push come azione ad alto rischio. **Per spostare i file su un altro PC NON usare `git push`** (deployerebbe): usa copia cartella o BACKUP (vedi §6).

---

## 2) Stato connessioni (verificato 2026-06-14, read-only + write transazionale)

| Servizio | Lettura | Scrittura |
|---|---|---|
| **DB Supabase** | ✅ provata (23 tabelle public) | ✅ verificata **transazionale + ROLLBACK** (nulla persiste) |
| **GitHub** | ✅ auth ok (`siteccv`), repo, CI | presente, non esercitata per policy |
| **Render** | ✅ API ok, live su commit `94e86d4` = HEAD | non eseguita per policy (autodeploy!) |
| **OpenAI** | ✅ `/models` 200 | n/a |
| **Resend (email)** | vedi §4 (analisi enterprise conclusa) | non testata (no invii senza richiesta) |

CI: workflow `Supabase Keepalive` verde ogni giorno; `Quality` su push/PR + dispatch.
Produzione = ultimo commit (allineata).

---

## 3) AUTOMAZIONE installata in questa sessione (guard sito live)

Per **applicare** (non solo documentare) il vincolo §0, è stato creato un guard Bash:

- `.claude/guard-bash.sh` — hook **PreToolUse** su Bash:
  - **DENY**: force/delete/mirror push, `git filter-branch/-repo`, `reflog expire`, `git clean -*x`,
    `rm -rf` di `/ ~ . .git BACKUP/ .env`, `DROP/TRUNCATE`.
  - **ASK**: ogni `git push`, `deploy.sh`, `db:push`/drizzle push, `DELETE FROM`, import/sync/upload/
    cleanup Supabase, `resend`, `git reset --hard`/`clean -f`/`restore .`, overwrite `.env`.
  - Tutto il resto (dev/build/test/lint, `git status|diff|log|add`, `colli:db:check`, dry-run,
    `rm -rf node_modules`) passa liscio.
- `.claude/settings.json` — registra l'hook + backstop statico `permissions.deny`/`ask`.

**Sul nuovo PC:** questi file stanno in `.claude/` (cartella, **non** tracciata in git). Se trasferisci
il progetto copiando la cartella o da BACKUP, il guard resta. Se invece cloni da GitHub, **non** ci sono
(sono untracked): andranno ricreati. All'avvio della nuova sessione apri `/hooks` o riavvia per caricarlo.

---

## 4) APPROFONDIMENTO RESEND — stato e prossimo passo (il punto dove eravamo)

### A cosa serve (solo questo)
Quando un cliente compila il form **"Richiesta Evento privato"**, il server (`server/routes/event-request.ts`)
**invia un'email con i dati a `info@cameraconvista.it`** (`replyTo` = email del cliente). È **l'unico canale**
con cui la richiesta arriva al ristorante: **NON viene salvata su DB**, non c'è elenco in admin. Se l'email
fallisce → errore 500 e **richiesta persa**. Resend è usato **solo qui**.

### Config REALE di produzione (da env Render, verificata)
In produzione **non** sono settate `RESEND_API_KEY`, `RESEND_SENDER_DOMAIN`, `EVENT_REQUEST_EMAIL`. Quindi:
- chiave usata = quella nel **DB** `site_settings.resend_api_key` (valida, tipo *sending-only*);
- mittente = `onboarding@resend.dev`; destinatario = default `info@cameraconvista.it`.

### Conclusioni chiave (per non rifare errori)
1. Le chiavi Resend del progetto sono **"sending-only"**: testandole su `GET /domains` danno **401
   `restricted_api_key`** → **sono VALIDE**, non rotte. NON diagnosticare "chiave invalida" da quel 401.
2. **"No domains yet" è NORMALE**, non un guasto: Resend senza dominio verificato spedisce da
   `onboarding@resend.dev` **solo verso l'email dell'account**. Dato che spedisce a `info@cameraconvista.it`
   e funziona, **l'account Resend di produzione corretto è `info@cameraconvista.it`**, workspace
   `cameraconvista`, con accesso collegato a Google/Gmail.
3. Account verificati SENZA dominio e NON di produzione: `dero975@gmail.com`, `cameraconvista`,
   (controllati anche `bistrot@cameraconvista.it`, `staff.ccv@gmail.com`).

### Stato confermato Resend (2026-06-15)
Account giusto: **`info@cameraconvista.it`**, workspace **`cameraconvista`**, accesso collegato a
**Google/Gmail**. In dashboard Resend sono presenti email "Richiesta evento" verso
`info@cameraconvista.it` in stato **Delivered**. La API key corretta è **`site-ccv-backend-prod`**
con permesso **Sending access**; il token visibile in dashboard coincide con prefisso/suffisso e
fingerprint verificati da DB e `.env` locale. **Non inserire mai la chiave completa in documentazione.**

### Miglioramento futuro OPZIONALE (solo proposta, NON implementato)
Salvare ogni richiesta su **DB** + pagina **admin "Richieste"** (così non si perde mai nulla e l'email
diventa una notifica opzionale). Da fare solo su richiesta esplicita dell'owner.

---

## 5) File creati/cambiati in questa sessione

- `.claude/guard-bash.sh` (nuovo, untracked) — guard hook.
- `.claude/settings.json` (nuovo, untracked) — registra hook + deny/ask.
- `RIPARTI_DA_QUI.md` (questo file, untracked).
- `.env` (locale, gitignored): la riga `RESEND_API_KEY` è stata riallineata alla chiave di **produzione**
  (quella del DB). Nessun altro file di progetto modificato. **Nessuna modifica a produzione / DB / deploy.**

Git: branch `main` pulito a parte gli untracked sopra. **Non** committato/pushato nulla.

---

## 6) Trasferimento sul nuovo PC (consigliato)

1. **NON** usare `git push` per trasferire (autodeploy ⇒ deploy in produzione).
2. Copia l'intera cartella di progetto **incluso `.env` e `.claude/`** (oppure crea un BACKUP — vedi
   `DNA/04_OPERATIONS_DEPLOY_GITHUB.md`, formato `BACKUP/Backup_<giorno> <Mese>_<HH.MM>`).
3. Sul nuovo PC: `npm ci` (o `npm install`); se Gatekeeper blocca binari nativi:
   `rm -rf node_modules && npm ci && xattr -dr com.apple.quarantine node_modules`.
4. Avvio: `PORT=5001 npm run dev`.

---

## 7) Come far ripartire l'agent nella chat NUOVA

Incolla un prompt tipo:
> "Leggi `RIPARTI_DA_QUI.md`, `README_OPERATIVO.md` e i `DNA/` pertinenti. Rispetta il vincolo: sito live,
> non compromettere nulla. Analizza il progetto e riprendi dal §4 (Resend): aiutami a confermare, read-only,
> che le email di produzione vengono recapitate, poi decidiamo."

Comandi read-only utili per ri-verificare lo stato (sicuri, niente scritture):
- Connessione DB (lettura) + prova scrittura transazionale-rollback: vedi pattern usato in sessione
  (node + `pg`, `BEGIN`/`CREATE TEMP TABLE`/`ROLLBACK`).
- Validità/prefisso chiave Resend di produzione (dal DB, senza stamparla intera): query
  `select value_it from site_settings where key='resend_api_key'` e mostrarne solo prefisso/lunghezza.
- Stato Render (servizio, env vars con segreti mascherati, deploy): Render API con `RENDER_API_KEY` dal `.env`.

> Regola d'oro: **leggere il codice come fonte di verità**, dichiarare i mismatch, non inventare,
> non stampare segreti, non toccare produzione senza richiesta.
