import fs from 'fs/promises';
import path from 'path';

const DEFAULT_MAX_FILES = 200;
const DEFAULT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Keep the shared import-error directory bounded: drop entries older than
 * maxAgeMs, then keep only the newest maxFiles entries. Never throws, because a
 * cleanup failure must not break the import itself.
 */
async function pruneImportErrorReports(
	directory,
	{ maxFiles = DEFAULT_MAX_FILES, maxAgeMs = DEFAULT_MAX_AGE_MS } = {},
) {
	let entries;

	try {
		entries = await fs.readdir(directory);
	} catch {
		return { removed: 0, kept: 0 };
	}

	const now = Date.now();
	const remaining = [];
	let removed = 0;

	for (const name of entries) {
		const filePath = path.join(directory, name);

		try {
			const stats = await fs.stat(filePath);

			if (!stats.isFile()) {
				continue;
			}

			if (now - stats.mtimeMs > maxAgeMs) {
				await fs.unlink(filePath);
				removed += 1;
				continue;
			}

			remaining.push({ filePath, mtimeMs: stats.mtimeMs });
		} catch {
			// Entry disappeared or is unreadable; leave it out of the budget.
		}
	}

	remaining.sort((left, right) => right.mtimeMs - left.mtimeMs);

	for (const entry of remaining.slice(maxFiles)) {
		try {
			await fs.unlink(entry.filePath);
			removed += 1;
		} catch {
			// Best effort only.
		}
	}

	return { removed, kept: Math.min(remaining.length, maxFiles) };
}

export { DEFAULT_MAX_AGE_MS, DEFAULT_MAX_FILES, pruneImportErrorReports };
