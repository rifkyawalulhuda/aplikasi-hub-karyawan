import { useCallback, useState } from 'react';

const STORAGE_KEY = 'hub-karyawan-recent-pages';
const LIMIT = 5;

function readRecent() {
	try {
		const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
		return Array.isArray(parsed) ? parsed.filter((entry) => entry?.href) : [];
	} catch {
		return [];
	}
}

function writeRecent(entries) {
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
		return entries;
	} catch {
		return entries;
	}
}

export default function useRecentPages() {
	const [recent, setRecent] = useState(readRecent);

	const pushRecent = useCallback((entry) => {
		if (!entry?.href) {
			return;
		}

		setRecent((prev) => {
			const next = [
				{ href: entry.href, title: entry.title, subtitle: entry.subtitle || '' },
				...prev.filter((item) => item.href !== entry.href),
			].slice(0, LIMIT);

			return writeRecent(next);
		});
	}, []);

	return { recent, pushRecent };
}
