import { describe, expect, it } from "vitest";
import {
  PUBLISHED_CONTENT_REFETCH_MS,
  PUBLISHED_CONTENT_STALE_TIME_MS,
} from "../../client/src/lib/queryClient";

// I contenuti pubblicati (vini/menu/cocktail) devono aggiornarsi da soli in pochi
// minuti anche col sito aperto dalla home del telefono, senza però pesare sul
// free tier Supabase. Fissiamo una finestra ragionevole (1–10 min) come guardia
// contro regressioni accidentali del valore.
describe("cadenza refresh contenuti pubblicati", () => {
  it("staleTime è ~5 minuti (tra 1 e 10 min)", () => {
    expect(PUBLISHED_CONTENT_STALE_TIME_MS).toBeGreaterThanOrEqual(60_000);
    expect(PUBLISHED_CONTENT_STALE_TIME_MS).toBeLessThanOrEqual(600_000);
  });

  it("refetchInterval è ~5 minuti (tra 1 e 10 min)", () => {
    expect(PUBLISHED_CONTENT_REFETCH_MS).toBeGreaterThanOrEqual(60_000);
    expect(PUBLISHED_CONTENT_REFETCH_MS).toBeLessThanOrEqual(600_000);
  });
});
