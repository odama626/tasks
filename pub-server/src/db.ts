import postgres from 'postgresjs';
import { load } from 'dotenv';

await load({ export: true });
console.log(Deno.env.get('POSTGRES_CONNECTION'))
export const sql = postgres(Deno.env.get('POSTGRES_CONNECTION'));
