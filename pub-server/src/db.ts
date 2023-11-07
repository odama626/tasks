import postgres from 'postgresjs';
import { load } from 'std/dotenv/mod.ts';
import { transaction } from '../migrations/00-initial.js';

await load({ export: true });
export const sql = postgres(Deno.env.get('POSTGRES_CONNECTION') ?? '');

await sql`drop table if exists system cascade`;
await sql`drop table if exists users cascade`;
await sql`drop table if exists inbox cascade`;
await sql`drop table if exists outbox cascade`;

await transaction(sql);
