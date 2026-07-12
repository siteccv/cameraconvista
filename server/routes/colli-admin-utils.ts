export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function parseIds(value: unknown): number[] {
  if (!Array.isArray(value)) throw new HttpError(400, "ids must be an array");
  return value.map(parseId);
}

export function parseId(value: unknown): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, "Invalid id");
  }
  return id;
}

export function requiredText(value: unknown, field: string): string {
  const text = optionalText(value);
  if (!text) throw new HttpError(400, `${field} required`);
  return text;
}

export function optionalText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(",", ".").trim();
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function isBcryptHash(value: string): boolean {
  return /^\$2[aby]\$/.test(value);
}

type SnapshotPruneClient = {
  query(queryText: string, values?: unknown[]): Promise<unknown>;
};

/**
 * Elimina le fotografie ARCHIVIATE del menu Colli più vecchie, conservando solo
 * le `retention` più recenti. Non tocca mai lo snapshot 'active'. Va invocata
 * dentro la transazione del publish, così un rollback non perde nulla.
 * `retention` viene forzata a un intero >= 1 per sicurezza.
 */
export async function pruneColliSnapshots(
  client: SnapshotPruneClient,
  retention: number,
): Promise<void> {
  const keep = Math.max(1, Math.trunc(retention));
  await client.query(
    `delete from colli_menu_snapshots
      where status = 'archived'
        and id not in (
          select id from colli_menu_snapshots
          where status = 'archived'
          order by created_at desc, id desc
          limit $1
        )`,
    [keep],
  );
}
