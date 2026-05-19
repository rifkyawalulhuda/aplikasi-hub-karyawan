import crypto from 'crypto';

const DEFAULT_ADMIN_SECRET = 'dev-admin-auth-secret';
const TOKEN_TTL_SECONDS = 60 * 60 * 12;

function getAdminAuthSecret() {
	const configuredSecret = process.env.ADMIN_AUTH_SECRET;

	if (configuredSecret) {
		return configuredSecret;
	}

	if (process.env.NODE_ENV === 'production') {
		throw new Error('ADMIN_AUTH_SECRET wajib diisi pada environment production.');
	}

	return DEFAULT_ADMIN_SECRET;
}

function toBase64Url(value) {
	return Buffer.from(value).toString('base64url');
}

function fromBase64Url(value) {
	return Buffer.from(String(value), 'base64url').toString('utf8');
}

function signTokenPayload(encodedHeader, encodedPayload) {
	return crypto
		.createHmac('sha256', getAdminAuthSecret())
		.update(`${encodedHeader}.${encodedPayload}`)
		.digest('base64url');
}

function createAdminAccessToken(admin) {
	const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
	const issuedAt = Math.floor(Date.now() / 1000);
	const payload = toBase64Url(
		JSON.stringify({
			sub: String(admin.id),
			employeeId: admin.employeeId,
			role: admin.role,
			tokenVersion: typeof admin.tokenVersion === 'number' ? admin.tokenVersion : 0,
			type: 'admin-access',
			iat: issuedAt,
			exp: issuedAt + TOKEN_TTL_SECONDS,
		}),
	);
	const signature = signTokenPayload(header, payload);

	return {
		token: `${header}.${payload}.${signature}`,
		expiresAt: new Date((issuedAt + TOKEN_TTL_SECONDS) * 1000).toISOString(),
	};
}

function verifyAdminAccessToken(token) {
	if (!token) {
		throw Object.assign(new Error('Token tidak ditemukan.'), { statusCode: 401 });
	}

	const [encodedHeader, encodedPayload, signature] = String(token).split('.');

	if (!encodedHeader || !encodedPayload || !signature) {
		throw Object.assign(new Error('Token tidak valid.'), { statusCode: 401 });
	}

	const expectedSignature = signTokenPayload(encodedHeader, encodedPayload);
	const signatureBuffer = Buffer.from(signature);
	const expectedBuffer = Buffer.from(expectedSignature);

	if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
		throw Object.assign(new Error('Token tidak valid.'), { statusCode: 401 });
	}

	let header;

	try {
		header = JSON.parse(fromBase64Url(encodedHeader));
	} catch {
		throw Object.assign(new Error('Token tidak valid.'), { statusCode: 401 });
	}

	if (header?.alg !== 'HS256' || header?.typ !== 'JWT') {
		throw Object.assign(new Error('Token tidak valid.'), { statusCode: 401 });
	}

	let payload;

	try {
		payload = JSON.parse(fromBase64Url(encodedPayload));
	} catch {
		throw Object.assign(new Error('Token tidak valid.'), { statusCode: 401 });
	}

	if (payload.type !== 'admin-access' || !payload.sub || !payload.employeeId) {
		throw Object.assign(new Error('Token tidak valid.'), { statusCode: 401 });
	}

	if (!payload.exp || Number(payload.exp) <= Math.floor(Date.now() / 1000)) {
		throw Object.assign(new Error('Sesi login sudah berakhir. Silakan login kembali.'), { statusCode: 401 });
	}

	return payload;
}

export { createAdminAccessToken, verifyAdminAccessToken };
