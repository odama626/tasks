import { load } from 'std/dotenv/mod.ts';
import { Hono } from 'hono';
import { router as wellKnownRouter } from '/routes/.well-known.ts';
import { router as usersRouter } from '/routes/users.ts';

type Bindings = {
	HOST: string;
	PG_POOL_SIZE: string;
};

type Variables = {};

await load({ export: true });

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use('*', async (c, next) => {
	c.env = Deno.env.toObject();
	await next();
});

app.get('/', (c) => c.text('Hello Hono!'));

app.route('/.well-known', wellKnownRouter);
app.route('/users', usersRouter);

const server = Deno.serve(app.fetch);
await server.finished;
