import { expect, test } from 'vitest';
import { createEvent, deleteAccount, login, register } from './api';

let account: Account;
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
	console.log(account);
	await createEvent(account, {
		to: ['self'],
		action: 'create',
		type: '',
		payload: {
			update: 'document',
			blah: '123'
		}
	});
});

test.sequential('delete account', async () => {
	expect(deleteAccount(account)).resolves.toBeTruthy();
});
