import { load } from 'dotenv';
import process from 'https://deno.land/std@0.132.0/node/process.ts';

await load({ export: true });

console.log(process.env.PGUSER)

import  'pgmg';




