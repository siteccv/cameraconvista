# Report: Privacy Policy, Cookie Policy & Consent Management

**Data implementazione:** 11 Febbraio 2026

---

## Route delle policy

| Pagina | Route | File |
|--------|-------|------|
| Privacy Policy | `/privacy` | `client/src/pages/privacy-policy.tsx` |
| Cookie Policy | `/cookie` | `client/src/pages/cookie-policy.tsx` |

Entrambe le pagine sono bilingui (IT/EN), con contenuti specifici per Camera con Vista (non generici).

---

## File toccati

| File | Modifiche |
|------|-----------|
| `client/src/pages/privacy-policy.tsx` | **NUOVO** – Pagina Privacy Policy completa bilingue |
| `client/src/pages/cookie-policy.tsx` | **NUOVO** – Pagina Cookie Policy completa bilingue |
| `client/src/components/CookieConsent.tsx` | **RISCRITTO** – Banner con pannello Preferenze (analytics/marketing toggle), gestione stato consenso via localStorage, eventi custom per reset/update |
| `client/src/components/ConsentTracking.tsx` | **NUOVO** – Componente che carica GA e Meta Pixel SOLO dopo consenso |
| `client/src/components/layout/PublicLayout.tsx` | Aggiunto `ConsentTracking` |
| `client/src/components/layout/Footer.tsx` | Aggiunti dati societari + link "Preferenze cookie" per riaprire il banner |
| `client/src/App.tsx` | Aggiunte route `/privacy` e `/cookie`, import pagine, `StaticPageRoute` component, page titles |
| `server/seo.ts` | Aggiunte entry SEO per pagine privacy e cookie (titoli, descrizioni IT/EN, slug-to-path) |

---

## Dati societari nel footer

Aggiunti nel footer in basso:
- Ragione sociale: CAMERA CON VISTA S.A.S. di Matteo Bonetti Camera Roda & C.
- Sede: Via Santo Stefano 14/2A – 40125 Bologna (BO)
- P.IVA / C.F.: 03488971205

Non inseriti IBAN/BIC o coordinate bancarie come da requisiti.

---

## Check-list: GA/Meta Pixel bloccati prima del consenso

| Check | Stato | Dettagli |
|-------|-------|----------|
| GA script non caricato senza consenso | ✅ | `ConsentTracking.tsx` verifica `getConsentState()` al mount – senza consenso `analytics=false`, lo script GA non viene iniettato |
| Meta Pixel non caricato senza consenso | ✅ | Stesso meccanismo – `marketing=false` di default, script Pixel non iniettato |
| "Solo essenziali" blocca tutto | ✅ | Salva `{"analytics":false,"marketing":false}` in localStorage |
| "Accetta tutti" abilita tutto | ✅ | Salva `{"analytics":true,"marketing":true}`, dispara evento `ccv_consent_update` |
| "Preferenze" permette scelta granulare | ✅ | Pannello con toggle separati per Statistiche e Marketing |
| Cambio preferenze da footer | ✅ | Link "Preferenze cookie" nel footer rimuove consenso e riapre il banner |
| Backward compatibility vecchio formato | ✅ | `getConsentState()` gestisce sia il vecchio formato stringa ("all"/"essential") che il nuovo formato JSON |

### Come verificare

1. Aprire il sito in finestra anonima
2. Aprire DevTools → Network
3. Verificare che NON ci siano richieste a `googletagmanager.com` o `connect.facebook.net`
4. Cliccare "Accetta tutti" nel banner cookie
5. Verificare che le richieste a GA/Pixel vengano effettuate (solo se i relativi ID sono configurati)

---

## TODO minimi

| Item | Stato | Note |
|------|-------|------|
| Configurare `VITE_GA_MEASUREMENT_ID` | ⏳ Da fare | Variabile d'ambiente per l'ID di Google Analytics (es. G-XXXXXXXXXX) |
| Configurare `VITE_FB_PIXEL_ID` | ⏳ Da fare | Variabile d'ambiente per l'ID del Meta Pixel |

Senza queste variabili d'ambiente, gli script di tracking non vengono caricati (comportamento safe-by-default). Una volta configurati, il sistema di consenso li gestirà automaticamente.

---

## Architettura del consenso

```
localStorage["ccv_cookie_consent"]
  → null: nessun consenso dato → banner visibile, GA/Pixel OFF
  → "essential": solo essenziali (legacy format supportato)
  → "all": tutto accettato (legacy format supportato)
  → {"analytics":true,"marketing":false}: formato JSON granulare

Eventi custom:
  → "ccv_consent_reset": riapre il banner (usato dal link footer)
  → "ccv_consent_update": notifica ConsentTracking del nuovo stato
```
