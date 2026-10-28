const MAX_RECIPIENTS = 50;

function normalizeRecipients(raw) {
	if (!Array.isArray(raw)) return [];

	const seen = new Set();
	const recipients = [];

	for (const entry of raw) {
		if (!entry || typeof entry !== 'object' || !entry.email) {
			continue;
		}

		const email = String(entry.email).trim();

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			continue;
		}

		const key = email.toLowerCase();

		if (seen.has(key)) {
			continue;
		}

		seen.add(key);
		recipients.push({
			email,
			name: String(entry.name || '').trim(),
			isActive: Boolean(entry.isActive ?? true),
		});

		if (recipients.length >= MAX_RECIPIENTS) {
			break;
		}
	}

	return recipients;
}

export { MAX_RECIPIENTS, normalizeRecipients };
