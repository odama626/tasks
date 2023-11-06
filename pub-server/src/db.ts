import postgres from 'postgresjs';
import { load } from 'dotenv';
import { transaction } from '../migrations/00-initial.js';

await load({ export: true });
console.log(Deno.env.get('POSTGRES_CONNECTION'));
export const sql = postgres(Deno.env.get('POSTGRES_CONNECTION'));

await sql`drop table if exists system cascade`
await sql`drop table if exists users cascade`;

await transaction(sql);