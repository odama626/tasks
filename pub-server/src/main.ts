import { Hono } from 'hono';
import { load } from 'dotenv';
import { router as wellKnownRouter } from './routes/.well-known.ts';
import { router as usersRouter } from './routes/users.ts'

type Bindings = {
	HOST: string;
	PG_POOL_SIZE: string;
};

type Variables = {};

console.info('loading env');
const env = (await load({ export: true })) as Bindings;

console.info('connecting to database');

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use('*', async (c, next) => {
	c.env = env;
	await next();
});

app.get('/', (c) => c.text('Hello Hono!'));

app.route('/.well-known', wellKnownRouter);
app.route('/users', usersRouter);

const server = Deno.serve(app.fetch);
await server.finished;
