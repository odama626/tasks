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
	const payload = encode(rawPayload);
	const signature = await createPayloadSignature(unencodedSigningKeys, payload);
	const { body, headers } = await preparePayload(
		rawPayload,
		{ signingKeys: unencodedSigningKeys },
		false
	);
	const account = await apiUrl
		.url('/account/register')
		.body(body)
		.headers(headers)
		.post(payload)
		.arrayBuffer(decode);

	userStore.update((user) => ({ ...user, account }));
}

export async function login(username: string, password: string) {
	const payload = await apiUrl.url(`/account/username/${username}`).get().arrayBuffer();
	const account = decode(payload);
	console.log({ account });

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
	console.log({ keys });
}
