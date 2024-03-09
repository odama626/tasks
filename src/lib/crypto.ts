import * as aesjs from 'aes-js';
import { argon2id } from 'hash-wasm';

const HASH = 'SHA-512';

export async function hash(password: string, salt: Uint32Array) {
	return await argon2id({
		password,
		salt,
		parallelism: 1,
		iterations: 256,
		memorySize: 512, // use 512KB memory
		hashLength: 32, // output size = 32 bytes
		outputType: 'binary' // return standard encoded string containing parameters needed to verify the key
	});
}

export async function createSymmKeyFromPassword(password: string, salt: Uint32Array) {
	const key = await hash(password, salt);
	const aesCtr = new aesjs.ModeOfOperation.ctr(key);
	return aesCtr;
}

export async function generateKeypair() {
	return await globalThis.crypto.subtle.generateKey(
		{
			name: 'RSA-OAEP',
			modulusLength: 4096,
			publicExponent: new Uint8Array([1, 0, 1]),
			hash: HASH
		},
		true,
		['encrypt', 'decrypt']
	);
}

export async function exportUserKeypair(key: CryptoKeyPair, password: string, salt: Uint32Array) {
	const publicKey = await globalThis.crypto.subtle.exportKey('jwk', key.publicKey);
	const rawPrivateKeyBytes = await globalThis.crypto.subtle.exportKey('pkcs8', key.privateKey);

	const passKey = await createSymmKeyFromPassword(password, salt);

	const encPrivateKeyBytes = passKey.encrypt(new Uint8Array(rawPrivateKeyBytes));

	return {
		publicKey,
		privateKey: aesjs.utils.hex.fromBytes(encPrivateKeyBytes)
	};
}

export async function importUserKeypair(key, password: string, salt: Uint32Array) {
	const passKey = await createSymmKeyFromPassword(password, salt);
	const encPrivBytes = aesjs.utils.hex.toBytes(key.privateKey);
	const privBytes = new Uint8Array(passKey.decrypt(encPrivBytes));

	const privateKey = await globalThis.crypto.subtle.importKey(
		'pkcs8',
		privBytes,
		{ name: 'RSA-OAEP', hash: HASH },
		true,
		['decrypt']
	);
	const publicKey = await globalThis.crypto.subtle.importKey(
		'jwk',
		key.publicKey,
		{ name: 'RSA-OAEP', hash: HASH },
		true,
		['encrypt']
	);

	return {
		publicKey,
		privateKey
	};
}

export async function testKeyPair(key: CryptoKeyPair) {
	const encoded = await globalThis.crypto.subtle.encrypt(
		{ name: `RSA-OAEP` },
		key.publicKey,
		new TextEncoder().encode('Hello')
	);
	const decoded = await globalThis.crypto.subtle.decrypt(
		{ name: `RSA-OAEP` },
		key.privateKey,
		encoded
	);
	return new TextDecoder().decode(decoded) === 'Hello';
}

export async function login(storageKeyPair, password: string, salt: Uint32Array) {
	const keyPair = await importUserKeypair(storageKeyPair, password, salt);
	const success = await testKeyPair(keyPair);
	if (!success) throw new Error('Failed to login');
	return keyPair;
}

export async function createSymmKey() {
	const password = new Uint8Array(32);
	const salt = new Uint32Array(32);

	globalThis.crypto.getRandomValues(password);
	globalThis.crypto.getRandomValues(salt);

	return await hash(new TextDecoder().decode(password), salt);
}

export function encryptWithKey(key: Uint8Array, payload: ArrayBuffer): ArrayBuffer {
	const aesCtr = new aesjs.ModeOfOperation.ctr(key);
	return aesCtr.encrypt(payload);
}

export function decryptWithKey(key: Uint8Array, payload: ArrayBuffer): ArrayBuffer {
	const aesCtr = new aesjs.ModeOfOperation.ctr(key);
	return aesCtr.decrypt(payload);
}

export async function exportSymmKey(keyPair: CryptoKeyPair, key: ArrayBuffer): Promise<string> {
	const encrypted = await globalThis.crypto.subtle.encrypt(
		{ name: `RSA-OAEP` },
		keyPair.publicKey,
		key
	);
	return aesjs.utils.hex.fromBytes(new Uint8Array(encrypted));
}

export async function importSymmKey(keyPair: CryptoKeyPair, hexKey: string): Promise<ArrayBuffer> {
	const key = new Uint8Array(aesjs.utils.hex.toBytes(hexKey));
	return await globalThis.crypto.subtle.decrypt({ name: `RSA-OAEP` }, keyPair.privateKey, key);
}
