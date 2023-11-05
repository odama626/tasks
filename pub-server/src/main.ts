import { Hono } from 'hono';
import { load } from 'dotenv';
import { Pool } from 'postgres';
import { router as wellKnownRouter } from './routes/.well-known.ts';
import type { QueryArguments } from 'https://deno.land/x/postgres@v0.17.0/query/query.ts';

type Bindings = {
	HOST: string;
	PG_POOL_SIZE: string;
};

type Variables = {
	runQuery: typeof runQuery;
};

console.info('loading env');
const env = (await load({ export: true })) as Bindings;

console.info('connecting to database');
const pool = new Pool(undefined, Number(env.PG_POOL_SIZE));

async function runQuery(query: string, args: QueryArguments) {
	const client = await pool.connect();
	let result;
	try {
		result = await client.queryObject(query);
	} finally {
		client.release();
	}
	return result;
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use('*', async (c, next) => {
	c.env = env;
	c.set('runQuery', runQuery);
	await next();
});

app.get('/', (c) => c.text('Hello Hono!'));

app.route('/.well-known', wellKnownRouter);

const server = Deno.serve(app.fetch);
await server.finished;
pool.end();
