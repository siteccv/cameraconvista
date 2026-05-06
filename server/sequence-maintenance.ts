import pg from "pg";

const { Pool } = pg;

type SequenceBackedTable = "pages" | "galleries" | "gallery_images";

const SEQUENCE_BY_TABLE: Record<SequenceBackedTable, string> = {
  pages: "pages_id_seq",
  galleries: "galleries_id_seq",
  gallery_images: "gallery_images_id_seq",
};

const maintenanceDbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

const maintenancePool = maintenanceDbUrl
  ? new Pool({
      connectionString: maintenanceDbUrl,
      max: 1,
    })
  : null;

export async function reserveNextSerialId(table: SequenceBackedTable): Promise<number | null> {
  if (!maintenancePool) {
    return null;
  }

  const sequence = SEQUENCE_BY_TABLE[table];
  const client = await maintenancePool.connect();

  try {
    await client.query("BEGIN");
    await client.query(`LOCK TABLE ${table} IN EXCLUSIVE MODE`);
    await client.query(
      `SELECT setval('${sequence}', COALESCE((SELECT MAX(id) FROM ${table}), 0), true)`,
    );

    const result = await client.query<{ id: string | number }>(
      `SELECT nextval('${sequence}') AS id`,
    );

    await client.query("COMMIT");
    return Number(result.rows[0]?.id ?? 0);
  } catch {
    await client.query("ROLLBACK");
    return null;
  } finally {
    client.release();
  }
}
