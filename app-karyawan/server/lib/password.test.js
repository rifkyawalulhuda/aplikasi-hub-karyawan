import { describe, expect, it } from 'vitest';

import { hashPassword, needsPasswordHash, verifyPassword } from './password.js';

describe('password hashing', () => {
	it('verifies a password against its scrypt hash', async () => {
		const hash = await hashPassword('Rahasia123');

		expect(hash.startsWith('scrypt$')).toBe(true);
		expect(await verifyPassword('Rahasia123', hash)).toBe(true);
		expect(await verifyPassword('Rahasia124', hash)).toBe(false);
	});

	it('fails closed for a legacy plaintext credential instead of comparing it', async () => {
		expect(await verifyPassword('Rahasia123', 'Rahasia123')).toBe(false);
		expect(needsPasswordHash('Rahasia123')).toBe(true);
	});

	it('rejects malformed or out-of-range scrypt parameters', async () => {
		expect(await verifyPassword('x', 'scrypt$999999999$8$1$salt$key')).toBe(false);
		expect(await verifyPassword('x', 'scrypt$16384$8$1$salt')).toBe(false);
		expect(await verifyPassword('x', 'scrypt$abc$8$1$salt$key')).toBe(false);
	});
});
