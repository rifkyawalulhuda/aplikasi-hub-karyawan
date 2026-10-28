const PRODUCTION_REQUIRED_ENV = ['DATABASE_URL', 'ADMIN_AUTH_SECRET', 'EMPLOYEE_AUTH_SECRET'];

function resolveTrustProxy(rawValue, nodeEnv = process.env.NODE_ENV) {
	const normalizedValue = rawValue === undefined || rawValue === null ? '' : String(rawValue).trim();

	if (!normalizedValue) {
		// Development runs on loopback only: never trust forwarding headers.
		// Production keeps the historical single-proxy assumption until the
		// operator sets TRUST_PROXY explicitly.
		return nodeEnv === 'production' ? 1 : false;
	}

	const lowered = normalizedValue.toLowerCase();

	if (lowered === 'false' || lowered === '0') {
		return false;
	}

	if (lowered === 'true') {
		return true;
	}

	const hopCount = Number(normalizedValue);

	if (Number.isInteger(hopCount) && hopCount >= 0) {
		return hopCount;
	}

	// Express also accepts a subnet list such as "loopback, 10.0.0.0/8".
	return normalizedValue;
}

function findMissingProductionEnv(env = process.env) {
	if (env.NODE_ENV !== 'production') {
		return [];
	}

	return PRODUCTION_REQUIRED_ENV.filter((key) => !env[key]);
}

export { findMissingProductionEnv, resolveTrustProxy };
