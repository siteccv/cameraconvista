# 05 - Guardrails e Decisioni

## Scopo

Raccogliere le regole non negoziabili e le decisioni gia prese che l'agent non deve ignorare.

## Guardrails forti

- Il sito e live
- Il codice e la fonte di verita primaria
- `DNA/` serve a ridurre errori, non a duplicare il repo
- Lo storico non operativo non deve restare nel percorso documentale attivo
- Non creare nuovi file `.md` paralleli con lo stesso scopo
- Non fare refactor larghi o estetici senza richiesta
- Non modificare logiche di business senza richiesta
- Non toccare deploy, sync o invii email senza richiesta
- Non esporre segreti, token o chiavi

## Decisioni gia prese

- L'entry point per l'agent e `README_OPERATIVO.md`
- `GITHUB_PUSH_GUIDE.md` resta in root per export e operativita
- `DNA/` deve restare corta e canonica
- `scripts/` e la cartella unica per build e utility operative
- `BookingDialog` resta condiviso
- La logica `PRIVATE_DINNER_ENABLED` controlla la sottopagina cena
- Il SEO resta separato perche e sistema tecnico sensibile

## Cosa non duplicare

- Documentazione operativa in piu posti
- Flussi auth admin
- Logiche publish/snapshot
- Route o pagine admin gia esistenti con stessa funzione
- Script di build o push paralleli senza motivo

## Quando aggiornare DNA

Aggiorna `DNA/` solo se cambia:

- architettura reale
- flusso critico
- workflow GitHub/deploy/backup
- comportamento Supabase/sync/snapshot
- guardrail operativo
- decisione stabile che l'agent deve conoscere

## Quando non aggiornare DNA

Non aggiornare `DNA/` per:

- micro-cambi grafici
- refusi UI
- spiegazioni narrative lunghe
- elenchi file-per-file senza valore operativo
- analisi una tantum

## Come deve comportarsi l'agent

1. leggere `README_OPERATIVO.md`
2. selezionare solo i file `DNA` pertinenti
3. verificare il codice reale
4. dichiarare eventuali mismatch tra docs e codice
5. trattare note storiche e audit passati come materiale secondario, recuperabile da Git o backup
6. tenere la documentazione asciutta, non enciclopedica
