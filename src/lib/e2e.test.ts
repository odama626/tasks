import { expect, test } from 'vitest';
import { createEvent, deleteAccount, login, register } from './api';

let account;
let username = 'test-user';
let password = 'test-password';

test.sequential('register', async () => {
	const result = await register({
		name: 'Test User',
		username,
		email: 'test-user@example.com',
		password,
		passwordConfirm: password
	});
	expect(result).toBeTruthy();
});

test.sequential('login', async () => {
	const result = await login(username, password);

	account = result;
});

test.sequential('create document', async () => {
	await createEvent(account, {
		to: 'self',
		from: '',
		payload: {
			update: 'document',
			blah: '123'
		}
	});
});

test.sequential('delete account', async () => {
	console.log({ account });
	expect(deleteAccount(account)).resolves.toBeTruthy();
});
