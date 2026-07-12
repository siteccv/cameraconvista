import { describe, expect, it } from "vitest";
import { guardSyncNotEmpty } from "../../server/sheets-sync";

// Freno di sicurezza anti-perdita dati: la sync foglio→DB cancella e ricarica.
// Se il foglio non produce righe valide, la guardia deve BLOCCARE la sync (e
// quindi impedire il deleteAll che svuoterebbe la tabella).
describe("guardSyncNotEmpty (protezione anti-wipe della sync)", () => {
  it("BLOCCA la sync quando la lista è vuota (0 righe) → niente delete", () => {
    const err = guardSyncNotEmpty("vini", 0);
    expect(err).not.toBeNull();
    expect(err).toMatch(/annullata/i);
    expect(err).toMatch(/NON è stata modificata/i);
  });

  it("BLOCCA anche con conteggi anomali negativi", () => {
    expect(guardSyncNotEmpty("menu", -1)).not.toBeNull();
  });

  it("CONSENTE la sync quando ci sono righe valide (>0) → nessun errore", () => {
    expect(guardSyncNotEmpty("vini", 56)).toBeNull();
    expect(guardSyncNotEmpty("menu", 1)).toBeNull();
    expect(guardSyncNotEmpty("cocktail", 29)).toBeNull();
  });

  it("il messaggio di errore nomina il contenuto e rassicura sui dati", () => {
    const err = guardSyncNotEmpty("vini", 0);
    expect(err).toContain("vini");
    expect(err).toMatch(/protezione anti-perdita/i);
  });
});
