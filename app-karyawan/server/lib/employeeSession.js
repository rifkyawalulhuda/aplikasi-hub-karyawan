import crypto from 'crypto';

const DEFAULT_SECRET = 'dev-employee-auth-secret';
const TOKEN_TTL_SECONDS = 60 * 60 * 12;

function getEmployeeAuthSecret() {
	return process.env.EMPLOYEE_AUTH_SECRET || DEFAULT_SECRET;
}

function toBase64Url(value) {
	return Buffer.from(value).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value) {
	const normalizedValue = String(value).replace(/-/g, '+').replace(/_/g, '/');
	const paddedValue = normalizedValue.padEnd(Math.ceil(normalizedValue.length / 4) * 4, '=');
	return Buffer.from(paddedValue, 'base64').toString('utf8');
}

function signTokenPayload(encodedHeader, encodedPayload) {
	return crypto
		.createHmac('sha256', getEmployeeAuthSecret())
		.update(`${encodedHeader}.${encodedPayload}`)
		.digest('base64')
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/g, '');
}

function createEmployeeAccessToken(employee) {
	const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
	const issuedAt = Math.floor(Date.now() / 1000);
	const payload = toBase64Url(
		JSON.stringify({
			sub: String(employee.id),
			nik: employee.employeeNo,
			type: 'employee-access',
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

function verifyEmployeeAccessToken(token) {
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

	let payload;

	try {
		payload = JSON.parse(fromBase64Url(encodedPayload));
	} catch {
		throw Object.assign(new Error('Token tidak valid.'), { statusCode: 401 });
	}

	if (payload.type !== 'employee-access' || !payload.sub) {
		throw Object.assign(new Error('Token tidak valid.'), { statusCode: 401 });
	}

	if (!payload.exp || Number(payload.exp) <= Math.floor(Date.now() / 1000)) {
		throw Object.assign(new Error('Sesi login sudah berakhir. Silakan login kembali.'), { statusCode: 401 });
	}

	return payload;
}

export { createEmployeeAccessToken, verifyEmployeeAccessToken };
