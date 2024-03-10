import * as aesjs from 'aes-js';
import { argon2id, sha3 } from 'hash-wasm';
import { bytesToBase64, base64ToBytes } from 'byte-base64';
import type { ArgumentsType } from 'vitest';

const ENCRYPTION_ALGORITHM = { name: 'RSA-OAEP', hash: { name: 'SHA-512' } };
const SIGNING_ALGORITHM = { name: 'RSASSA-PKCS1-v1_5', hash: { name: 'SHA-512' } };

export async function hashPassword(password: string, salt: Uint32Array) {
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
	const key = await hashPassword(password, salt);
	const aesCtr = new aesjs.ModeOfOperation.ctr(key);
	return aesCtr;
}

export async function generateEncryptionKeypair() {
	return await globalThis.crypto.subtle.generateKey(
		{
			...ENCRYPTION_ALGORITHM,
			modulusLength: 4096,
			publicExponent: new Uint8Array([1, 0, 1])
		},
		true,
		['encrypt', 'decrypt']
	);
}

export async function generateSigningKeypair() {
	return await globalThis.crypto.subtle.generateKey(
		{ ...SIGNING_ALGORITHM, modulusLength: 4096, publicExponent: new Uint8Array([1, 0, 1]) },
		true,
		['sign', 'verify']
	);
}

export async function exportUserKeypair(
	key: CryptoKeyPair,
	password: string,
	salt: Uint32Array
): Promise<ProtectedKeyPair> {
	const publicKey = await globalThis.crypto.subtle.exportKey('jwk', key.publicKey);
	const rawPrivateKeyBytes = await globalThis.crypto.subtle.exportKey('pkcs8', key.privateKey);

	const passKey = await createSymmKeyFromPassword(password, salt);

	const encPrivateKeyBytes = passKey.encrypt(new Uint8Array(rawPrivateKeyBytes));

	return {
		publicKey,
		privateKeyHash: bytesToBase64(encPrivateKeyBytes)
	};
}

interface ProtectedKeyPair {
	privateKeyHash: string;
	publicKey: JsonWebKey;
}

export async function importKeyPair(
	key: ProtectedKeyPair,
	password: string,
	salt: Uint32Array,
	algorithm: Parameters<SubtleCrypto['importKey']>[2],
	privateUsages: KeyUsage[],
	publicUsages: KeyUsage[]
): Promise<CryptoKeyPair> {
	const passKey = await createSymmKeyFromPassword(password, salt);
	const encPrivBytes = base64ToBytes(key.privateKeyHash);
	const privBytes = new Uint8Array(passKey.decrypt(encPrivBytes));
	const subtle = globalThis.crypto.subtle;

	const privateKey = await subtle.importKey('pkcs8', privBytes, algorithm, true, privateUsages);
	const publicKey = await subtle.importKey('jwk', key.publicKey, algorithm, true, publicUsages);

	return {
		publicKey,
		privateKey
	};
}

export async function importEncryptionKeyPair(
	key: ProtectedKeyPair,
	password: string,
	salt: Uint32Array
) {
	return importKeyPair(key, password, salt, ENCRYPTION_ALGORITHM, ['decrypt'], ['encrypt']);
}

export async function importSigningKeyPair(
	key: ProtectedKeyPair,
	password: string,
	salt: Uint32Array
) {
	return importKeyPair(key, password, salt, SIGNING_ALGORITHM, ['sign'], ['verify']);
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

export async function createPayloadSignature(keyPair: CryptoKeyPair, payload: ArrayBuffer) {
	const signature = await globalThis.crypto.subtle.sign(
		SIGNING_ALGORITHM.name,
		keyPair.privateKey,
		payload
	);
	return bytesToBase64(new Uint8Array(signature));
}

export async function verifySignature(
	keyPair: CryptoKeyPair,
	payload: ArrayBuffer,
	encodedSignature: string
) {
	const signature = new Uint8Array(base64ToBytes(encodedSignature));
	return await globalThis.crypto.subtle.verify(
		SIGNING_ALGORITHM.name,
		keyPair.publicKey,
		signature,
		payload
	);
}

export async function login(
	protectedEncryptionKey: ProtectedKeyPair,
	protectedSigningKey: ProtectedKeyPair,
	password: string,
	salt: Uint32Array
) {
	const encryptionKey = await importEncryptionKeyPair(protectedEncryptionKey, password, salt);
	if (!(await testKeyPair(encryptionKey))) throw new Error('Failed to login');
	const signingKey = await importSigningKeyPair(protectedSigningKey, password, salt);
	return { encryptionKey, signingKey };
}

export async function createSymmKey() {
	const password = new Uint8Array(32);
	const salt = new Uint32Array(32);

	globalThis.crypto.getRandomValues(password);
	globalThis.crypto.getRandomValues(salt);

	return await hashPassword(new TextDecoder().decode(password), salt);
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
	return bytesToBase64(new Uint8Array(encrypted));
}

export async function importSymmKey(
	keyPair: CryptoKeyPair,
	encodedKey: string
): Promise<ArrayBuffer> {
	const key = new Uint8Array(base64ToBytes(encodedKey));
	return await globalThis.crypto.subtle.decrypt({ name: `RSA-OAEP` }, keyPair.privateKey, key);
}
