import { load } from 'dotenv';

const env = await load({ export: true });

console.log(env.POSTGRES_CONNECTION)

import 'pgmg';




