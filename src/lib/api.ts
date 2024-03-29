import {
	createPayloadSignature,
	exportUserKeypair,
	generateEncryptionKeypair,
	generateSalt,
	generateSigningKeypair
} from '$lib/crypto';
import { decode, encode } from '@msgpack/msgpack';
import wretch from 'wretch';
import { login as cryptoLogin } from '$lib/crypto';

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
	const result = await apiUrl
		.url('/account/register')
		.headers({ signature, 'Content-Type': 'application/msgpack' })
		.post(payload)
		.json();
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
