import { afterEach, describe, expect, it, vi } from "vitest";

// Mock del modulo Supabase: nessuna rete, controlliamo noi le risposte.
const fromMock = vi.fn();
vi.mock("../../server/supabase", () => ({
  isSupabaseAdminConfigured: true,
  supabaseAdmin: { from: (table: string) => fromMock(table) },
}));

import { pruneColliSnapshots } from "../../server/routes/colli-admin-utils";
import { supabaseColliPool } from "../../server/colli-supabase-adapter";

// Builder Supabase concatenabile e "thenable" che risolve al valore dato.
function makeBuilder(result: unknown) {
  const calls: unknown[][] = [];
  const record =
    (name: string) =>
    (...args: unknown[]) => {
      calls.push([name, ...args]);
      return builder;
    };
  const builder: Record<string, unknown> = {
    calls,
    select: record("select"),
    delete: record("delete"),
    eq: record("eq"),
    not: record("not"),
    order: record("order"),
    limit: record("limit"),
    then: (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  };
  return builder;
}

afterEach(() => {
  fromMock.mockReset();
});

describe("adapter Supabase Colli — retention snapshot (percorso reale prune → adapter)", () => {
  it("NON lancia più 'Unsupported' e traduce la pulizia in select+delete Supabase", async () => {
    // 5 archiviate restituite con keep=5 -> ci possono essere righe più vecchie da eliminare.
    const keepIds = [50, 49, 48, 47, 46];
    const selectBuilder = makeBuilder({ data: keepIds.map((id) => ({ id })), error: null });
    const deleteBuilder = makeBuilder({ error: null });
    fromMock.mockReturnValueOnce(selectBuilder).mockReturnValueOnce(deleteBuilder);

    await expect(pruneColliSnapshots(supabaseColliPool, 5)).resolves.toBeUndefined();

    // Fase SELECT: solo archiviate, ordinamento desc, limit = keep
    const s = selectBuilder.calls as unknown[][];
    expect(s).toContainEqual(["eq", "status", "archived"]);
    expect(s).toContainEqual(["order", "created_at", { ascending: false }]);
    expect(s).toContainEqual(["limit", 5]);

    // Fase DELETE: solo archiviate, escludendo gli id da conservare
    const d = deleteBuilder.calls as unknown[][];
    expect(d).toContainEqual(["delete"]);
    expect(d).toContainEqual(["eq", "status", "archived"]);
    expect(d).toContainEqual(["not", "id", "in", "(50,49,48,47,46)"]);
  });

  it("NON esegue alcuna DELETE quando le archiviate sono meno della soglia", async () => {
    // Solo 2 archiviate con keep=30 -> niente da eliminare, nessuna seconda chiamata from().
    const selectBuilder = makeBuilder({ data: [{ id: 2 }, { id: 1 }], error: null });
    fromMock.mockReturnValueOnce(selectBuilder);

    await expect(pruneColliSnapshots(supabaseColliPool, 30)).resolves.toBeUndefined();

    expect(fromMock).toHaveBeenCalledTimes(1);
    expect(fromMock).toHaveBeenCalledWith("colli_menu_snapshots");
  });

  it("propaga l'errore del DB in fase di select senza inghiottirlo", async () => {
    const selectBuilder = makeBuilder({ data: null, error: { message: "db down" } });
    fromMock.mockReturnValueOnce(selectBuilder);

    await expect(pruneColliSnapshots(supabaseColliPool, 30)).rejects.toThrow("db down");
  });
});
