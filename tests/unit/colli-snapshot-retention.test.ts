import { describe, expect, it, vi } from "vitest";
import { pruneColliSnapshots } from "../../server/routes/colli-admin-utils";

describe("pruneColliSnapshots", () => {
  it("elimina solo gli snapshot archiviati oltre la soglia, conservando i più recenti", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });

    await pruneColliSnapshots({ query }, 30);

    expect(query).toHaveBeenCalledTimes(1);
    const [sql, params] = query.mock.calls[0];
    // Tocca SOLO le fotografie archiviate, mai la 'active'
    expect(sql).toMatch(/delete from colli_menu_snapshots/i);
    expect(sql).toMatch(/where status = 'archived'/i);
    expect(sql).not.toMatch(/'active'/i);
    // Conserva le N più recenti (ordinamento decrescente + limit parametrico)
    expect(sql).toMatch(/order by created_at desc/i);
    expect(params).toEqual([30]);
  });

  it("forza la retention a un intero >= 1 anche con input anomali", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });

    await pruneColliSnapshots({ query }, 0);
    expect(query.mock.calls[0][1]).toEqual([1]);

    query.mockClear();
    await pruneColliSnapshots({ query }, -5);
    expect(query.mock.calls[0][1]).toEqual([1]);

    query.mockClear();
    await pruneColliSnapshots({ query }, 30.9);
    expect(query.mock.calls[0][1]).toEqual([30]);
  });

  it("propaga l'errore del DB senza inghiottirlo (così la transazione fa rollback)", async () => {
    const query = vi.fn().mockRejectedValue(new Error("db down"));

    await expect(pruneColliSnapshots({ query }, 30)).rejects.toThrow("db down");
  });
});
