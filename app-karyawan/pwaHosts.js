const DEFAULT_EMPLOYEE_PORTAL_HOSTNAMES = ['pwa.aplikasi-hub.my.id', 'pwa-karyawan.vercel.app'];

const DEFAULT_ALLOWED_HOSTS = ['aplikasi-hub.my.id', 'www.aplikasi-hub.my.id', 'api.aplikasi-hub.my.id'];

const EMPLOYEE_PORTAL_BASE_PATH = '/karyawan';
const EMPLOYEE_PORTAL_LOGIN_PATH = '/karyawan/login';

function normalizeHostname(value) {
	return String(value || '')
		.trim()
		.toLowerCase();
}

function normalizeHostnames(values) {
	const items = Array.isArray(values) ? values : [values];

	return items
		.flatMap((item) => String(item || '').split(','))
		.map((item) => normalizeHostname(item))
		.filter(Boolean);
}

function buildEmployeePortalHostnames(extraHostnames = []) {
	return [
		...new Set([...normalizeHostnames(DEFAULT_EMPLOYEE_PORTAL_HOSTNAMES), ...normalizeHostnames(extraHostnames)]),
	];
}

function isEmployeePortalHostname(hostname, extraHostnames = []) {
	const normalizedHostname = normalizeHostname(hostname);

	if (!normalizedHostname) {
		return false;
	}

	if (normalizedHostname.endsWith('.vercel.app')) {
		return true;
	}

	return buildEmployeePortalHostnames(extraHostnames).includes(normalizedHostname);
}

function buildAllowedHosts(extraHostnames = []) {
	return [
		...new Set([...normalizeHostnames(DEFAULT_ALLOWED_HOSTS), ...buildEmployeePortalHostnames(extraHostnames)]),
	];
}

function isEmployeePortalPath(pathname) {
	return pathname === EMPLOYEE_PORTAL_BASE_PATH || pathname.startsWith(`${EMPLOYEE_PORTAL_BASE_PATH}/`);
}

function getEmployeePortalRedirectTarget(locationLike, extraHostnames = []) {
	if (!locationLike || !isEmployeePortalHostname(locationLike.hostname, extraHostnames)) {
		return null;
	}

	if (isEmployeePortalPath(locationLike.pathname)) {
		return null;
	}

	return `${EMPLOYEE_PORTAL_LOGIN_PATH}${locationLike.search || ''}${locationLike.hash || ''}`;
}

export {
	DEFAULT_ALLOWED_HOSTS,
	DEFAULT_EMPLOYEE_PORTAL_HOSTNAMES,
	EMPLOYEE_PORTAL_BASE_PATH,
	EMPLOYEE_PORTAL_LOGIN_PATH,
	buildAllowedHosts,
	buildEmployeePortalHostnames,
	getEmployeePortalRedirectTarget,
	isEmployeePortalHostname,
	isEmployeePortalPath,
};
