# Analisi Fattibilità: Sistema Notifiche Email per Richieste Eventi

## 1. Descrizione del Requisito
L'obiettivo è permettere agli utenti del sito "Camera con Vista" di inviare richieste di preventivo o organizzazione eventi tramite un modulo precompilato. 
L'utente seleziona le proprie preferenze (data, numero persone, tipo evento, note) e l'amministratore riceve una email strutturata con tutti i dettagli.

## 2. Analisi Tecnica
L'implementazione è perfettamente fattibile integrando lo stack attuale (React + Node.js/Express).

### Componenti necessari:
- **UI (Frontend)**: Un modulo dedicato nella pagina `/eventi` o una nuova sottopagina `/eventi/richiesta`.
- **API (Backend)**: Un endpoint dedicato per ricevere i dati del modulo e gestire la logica di invio.
- **Template Email**: Un modello HTML professionale che formatti i dati ricevuti in modo leggibile per l'admin.
- **Service Provider (External)**: Un servizio per il trasporto delle email.

## 3. Servizi Esterni Consigliati (Piani Gratuiti)

Per garantire che le email non finiscano in spam e vengano consegnate istantaneamente, si consiglia l'uso di un servizio API dedicato.

| Servizio | Piano Gratuito | Vantaggi |
|----------|----------------|----------|
| **Resend** | 3,000 email/mese (100/giorno) | **Scelta consigliata.** Integrazione nativa in Replit, setup rapido, ottima deliverability. |
| **SendGrid** | 100 email/giorno | Standard di settore, molto affidabile, ottimi report. |
| **Brevo (Sendinblue)** | 300 email/giorno | Molto semplice da configurare via SMTP o API. |

## 4. Proposta di Implementazione

### Fase 1: Creazione del Modulo (Frontend)
Utilizzeremo i componenti `shadcn/ui` già presenti nel progetto per creare un form elegante che includa:
- Nome e Cognome
- Recapito (Email/Telefono)
- Data presunta dell'evento
- Numero di ospiti
- Tipo di evento (Compleanno, Laurea, Aziendale, etc.)
- Note/Richieste particolari

### Fase 2: Logica di Invio (Backend)
Verrà configurato un servizio (es. Resend) tramite variabili d'ambiente protette (Secrets).
Il server riceverà i dati, verificherà la validità e comporrà la mail:
```html
<h1>Nuova Richiesta Evento - Camera con Vista</h1>
<p><strong>Cliente:</strong> Mario Rossi</p>
<p><strong>Data:</strong> 25/06/2026</p>
...
```

### Fase 3: Archiviazione (Opzionale ma consigliata)
Oltre all'invio della mail, i dati della richiesta possono essere salvati in una nuova tabella del database (`event_requests`) per permettere all'admin di consultare lo storico direttamente dal pannello `/admina`.

## 5. Conclusione
L'integrazione non richiede piattaforme esterne per l'utente finale, mantenendo l'esperienza fluida all'interno del sito. L'appoggio a un servizio esterno (Resend/SendGrid) è necessario solo per la parte infrastrutturale dell'invio mail, garantendo professionalità e affidabilità a costo zero.

---
**Stato**: Analisi completata. Pronto per l'implementazione su richiesta.
