import { describe, expect, it } from 'vitest';

import { findMissingProductionEnv, resolveTrustProxy } from './httpConfig.js';

describe('resolveTrustProxy', () => {
	it('keeps the historical single-proxy default only in production', () => {
		expect(resolveTrustProxy(undefined, 'production')).toBe(1);
		expect(resolveTrustProxy('', 'production')).toBe(1);
		expect(resolveTrustProxy(undefined, 'development')).toBe(false);
	});

	it('honours an explicit boolean-like value', () => {
		expect(resolveTrustProxy('false', 'production')).toBe(false);
		expect(resolveTrustProxy('0', 'production')).toBe(false);
		expect(resolveTrustProxy('true', 'production')).toBe(true);
	});

	it('accepts a hop count and an Express subnet list', () => {
		expect(resolveTrustProxy('2', 'production')).toBe(2);
		expect(resolveTrustProxy('loopback, 10.0.0.0/8', 'production')).toBe('loopback, 10.0.0.0/8');
	});
});

describe('findMissingProductionEnv', () => {
	it('does not enforce secrets outside production', () => {
		expect(findMissingProductionEnv({ NODE_ENV: 'development' })).toEqual([]);
	});

	it('lists every required secret missing in production', () => {
		expect(findMissingProductionEnv({ NODE_ENV: 'production' })).toEqual([
			'DATABASE_URL',
			'ADMIN_AUTH_SECRET',
			'EMPLOYEE_AUTH_SECRET',
		]);
	});

	it('passes when production has all required values', () => {
		expect(
			findMissingProductionEnv({
				NODE_ENV: 'production',
				DATABASE_URL: 'postgresql://x',
				ADMIN_AUTH_SECRET: 'a',
				EMPLOYEE_AUTH_SECRET: 'b',
			}),
		).toEqual([]);
	});
});
