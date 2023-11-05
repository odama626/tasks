import { Hono, HTTPException } from 'hono';
import { sql } from '../db.ts'

export const router = new Hono();

router.get('/webfinger', async (c) => {
	const resource = c.req.query('resource');

	if (!resource) throw new HTTPException(400, { message: `resource query parameter is required` });

	const [type, identifier] = resource.split(':');

	if (type !== 'acct')
		throw new HTTPException(400, { message: `unrecognized request format "${type}"` });

	const [username, domain] = identifier.split('@');

	console.log(c.env);

	if (domain !== c.env?.HOST)
		throw new HTTPException(400, { message: `not associated with domain "${domain}"` });

  sql`select `

  return c.jsonT({
    
  })
});
