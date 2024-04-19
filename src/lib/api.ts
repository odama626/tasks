import {
	createPayloadSignature,
	encryptPayload,
	encryptWithKey,
	exportUserKeypair,
	generateEncryptionKeypair,
	generateSalt,
	generateSigningKeypair
} from '$lib/crypto';
import { decode, encode } from '@msgpack/msgpack';
import wretch, { type Wretch, type WretchAddon } from 'wretch';
import { login as cryptoLogin } from '$lib/crypto';
import { userStore } from './storage';

type Account = any;

async function preparePayload(payload, user, encrypt = true) {
	let body = encode(payload);
	if (encrypt) {
		body = await encryptPayload(user.encryptionKeys, body);
	}
	const signature = await createPayloadSignature(user.signingKeys, body);
	return {
		body,
		headers: { signature, 'Content-Type': 'application/msgpack' }
	};
}

const apiUrl = wretch(`http://localhost:4000`);
export async function register(data) {
	const passwordSalt = generateSalt();
	const { password, passwordConfirm, ...rest } = data;
	let unencodedSigningKeys;
	const [signingKeys, encryptionKeys] = await Promise.all([
		generateSigningKeypair().then((keys) => {
			unencodedSigningKeys = keys;
			return exportUserKeypair(keys, password, passwordSalt);
		}),
		generateEncryptionKeypair().then((keys) => exportUserKeypair(keys, password, passwordSalt))
	]);

	const rawPayload = {
		...rest,
		passwordSalt: passwordSalt,
		signingKeys,
		encryptionKeys
	};
	const { body, headers } = await preparePayload(
		rawPayload,
		{ signingKeys: unencodedSigningKeys },
		false
	);
	const account = await apiUrl
		.url('/account/register')
		.body(body)
		.headers(headers)
		.post()
		.arrayBuffer(decode);

	return account;
}

export async function login(username: string, password: string): Promise<Account> {
	const payload = await apiUrl.url(`/account/username/${username}`).get().arrayBuffer();
	const account = decode(payload);

	const keys = await cryptoLogin(
		account.encryptionKeys,
		account.signingKeys,
		password,
		account.passwordSalt
	).catch((e) => {
		throw {
			code: 400,
			message: 'Failed to authenticate'
		};
	});

	Object.defineProperty(account, 'keys', {
		get() {
			return keys;
		}
	});
	return account;
}

export async function deleteAccount(account: Account) {
	const { body, headers } = await preparePayload(
		{ username: account.username },
		account.keys,
		false
	);

	const result = await apiUrl.url('/account/delete').headers(headers).body(body).post().res();
	return result.ok;
}
