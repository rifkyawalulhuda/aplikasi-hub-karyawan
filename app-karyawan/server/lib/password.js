import crypto from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(crypto.scrypt);
const PASSWORD_HASH_PREFIX = 'scrypt';
const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_OPTIONS = {
	N: 16384,
	r: 8,
	p: 1,
};

function normalizePassword(value = '') {
	return String(value).trim();
}

function isPasswordHash(value = '') {
	return String(value).startsWith(`${PASSWORD_HASH_PREFIX}$`);
}

async function hashPassword(password) {
	const normalizedPassword = normalizePassword(password);
	const salt = crypto.randomBytes(16).toString('base64url');
	const key = await scrypt(normalizedPassword, salt, SCRYPT_KEY_LENGTH, SCRYPT_OPTIONS);

	return [
		PASSWORD_HASH_PREFIX,
		SCRYPT_OPTIONS.N,
		SCRYPT_OPTIONS.r,
		SCRYPT_OPTIONS.p,
		salt,
		key.toString('base64url'),
	].join('$');
}

function safeEqual(left, right) {
	const leftBuffer = Buffer.from(String(left));
	const rightBuffer = Buffer.from(String(right));

	return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

async function verifyPassword(password, storedPassword) {
	const normalizedPassword = normalizePassword(password);
	const normalizedStoredPassword = normalizePassword(storedPassword);

	if (!isPasswordHash(normalizedStoredPassword)) {
		return safeEqual(normalizedPassword, normalizedStoredPassword);
	}

	const [, n, r, p, salt, expectedKey] = normalizedStoredPassword.split('$');
	const key = await scrypt(normalizedPassword, salt, SCRYPT_KEY_LENGTH, {
		N: Number(n),
		r: Number(r),
		p: Number(p),
	});

	return safeEqual(key.toString('base64url'), expectedKey);
}

function needsPasswordHash(storedPassword) {
	return !isPasswordHash(storedPassword);
}

export { hashPassword, needsPasswordHash, normalizePassword, verifyPassword };
