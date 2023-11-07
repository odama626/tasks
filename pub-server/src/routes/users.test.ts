import { router } from './users.ts';
import { assertSnapshot } from 'std/testing/snapshot.ts'

Deno.test('user is created', async (t) => {
	const res = await router.request('/', {
		method: 'POST',
		body: JSON.stringify({
			username: 'test-user',
			password: 'password',
			email: 'test-user@example.com'
		})
	});

  console.log({ res})

  await assertSnapshot(t, await res.json())
});
