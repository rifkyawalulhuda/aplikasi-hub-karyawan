import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import { afterEach, describe, expect, it } from 'vitest';

import { pruneImportErrorReports } from './importErrorReports.js';

const createdDirectories = [];

async function createTempDirectory() {
	const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'import-error-reports-'));
	createdDirectories.push(directory);
	return directory;
}

async function writeFileWithAge(directory, name, ageMs) {
	const filePath = path.join(directory, name);
	await fs.writeFile(filePath, 'report');
	const timestamp = new Date(Date.now() - ageMs);
	await fs.utimes(filePath, timestamp, timestamp);
}

afterEach(async () => {
	for (const directory of createdDirectories.splice(0)) {
		await fs.rm(directory, { recursive: true, force: true });
	}
});

describe('pruneImportErrorReports', () => {
	it('removes expired reports and keeps the newest maxFiles entries', async () => {
		const directory = await createTempDirectory();

		await writeFileWithAge(directory, 'old.xlsx', 8 * 24 * 60 * 60 * 1000);
		await writeFileWithAge(directory, 'a.xlsx', 3000);
		await writeFileWithAge(directory, 'b.xlsx', 2000);
		await writeFileWithAge(directory, 'c.xlsx', 1000);

		const result = await pruneImportErrorReports(directory, { maxFiles: 2 });

		expect(result.removed).toBe(2);
		expect((await fs.readdir(directory)).sort()).toEqual(['b.xlsx', 'c.xlsx']);
	});

	it('is a no-op for a missing directory', async () => {
		const result = await pruneImportErrorReports(path.join(os.tmpdir(), 'does-not-exist-import-reports'));

		expect(result).toEqual({ removed: 0, kept: 0 });
	});
});
