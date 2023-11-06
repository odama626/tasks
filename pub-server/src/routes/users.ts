import { Hono, HTTPException } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { ArgonWorker } from 'argon2';
import { sql } from '../db.ts';
import { z } from 'zod';
import * as base64 from 'std/encoding/base64';

export const router = new Hono();
const worker = new ArgonWorker();
const encoder = new TextEncoder();

router.post(
	'/',
	zValidator(
		'json',
		z.object({
			username: z.string().min(4),
			password: z.string().min(13),
			email: z.string().email()
		})
	),
	async (c) => {
		const body = c.req.json();
		console.log({ body });
		const exists = await sql`select id from users where username = ${body.username}`;

		console.log({ exists }, exists.length);

		if (exists.length)
			throw new HTTPException(400, { message: `A user with that username already exists` });

		const salt = crypto.getRandomValues(new Uint8Array(Math.max(8, Math.random() * 32)));
		const hash = await worker.hash(encoder.encode(body.password), salt);
		const keyPair = await crypto.subtle.generateKey(
			{
				name: 'RSA-OAEP',
				modulusLength: 2048,
				publicExponent: new Uint8Array([1, 0, 1]),
				hash: 'SHA-512'
			},
			true,
			['encrypt', 'decrypt']
		);
		const privateKey = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
		const publicKeySpki = await crypto.subtle.exportKey('spki', keyPair.publicKey);

		const publicKey = `-----BEGIN PUBLIC KEY-----${base64.encode(
			publicKeySpki
		)}-----END PUBLIC KEY-----`;

		const result = await sql`
      insert into users(username, hash, salt, private_key, public_key)
      values(
        ${body.username},
        ${hash},
        ${salt},
        ${JSON.stringify(privateKey)},
        ${publicKey}
      ) returning id`;

		const { username } = body;

		return c.json({ username, id: result[0].id });
	}
);

router.get('/:username', async (c) => {
	const username = c.req.param('username');
	const [result] = await sql`select username, public_key from users where username = ${username}`;

	if (!result) throw new HTTPException(400, { message: `user ${username} doesn't exist` });

	return c.jsonT(getUserLd(result, c.env));
});

function getUserLd(user, { HOST }) {
	return {
		'@context': ['https://www.w3.org/ns/activitystreams', 'https://w3id.org/security/v1'],
		id: `https://${HOST}/users/${user.username}`,
		type: 'Person',
		preferredUsername: user.username,
		inbox: `https://${HOST}/inbox`,
		publicKey: {
			id: `https://${HOST}/users/${user.username}#public-key`,
			owner: `https://${HOST}/users/${user.username}`,
			publicKeyPem: user.public_key
		}
	};
}

router.get('/', async (c) => {
	const results = await sql`select username, public_key from users`;

	return c.jsonT(results.map((user) => getUserLd(user, c.env)));
});


router.post('/:username/inbox', c => {
	
})