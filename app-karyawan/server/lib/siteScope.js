const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function isSafeMethod(method) {
	return SAFE_METHODS.has(String(method || '').toUpperCase());
}

function isSuperAdmin(req) {
	return req.admin?.role === 'super_admin';
}

function getAdminSiteId(req) {
	const siteId = req.admin?.siteId;
	return Number.isInteger(siteId) ? siteId : null;
}

function parseQuerySiteId(req) {
	const raw = req.query?.siteId;
	if (raw == null || raw === '') {
		return null;
	}
	const parsed = Number(raw);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Site filter for read queries.
 * - super_admin: all sites, or the site picked in the UI (query.siteId)
 * - site-scoped admin: always their own site, query param is ignored
 */
function buildSiteWhere(req) {
	if (isSuperAdmin(req)) {
		const querySiteId = parseQuerySiteId(req);
		return querySiteId ? { siteId: querySiteId } : {};
	}

	const siteId = getAdminSiteId(req);
	return siteId ? { siteId } : { siteId: -1 };
}

/**
 * Site filter for relation-based queries (rows without their own siteId).
 * e.g. buildEmployeeSiteWhere(req) -> { employee: { siteId: 2 } }
 */
function buildRelationSiteWhere(req, relationName) {
	if (isSuperAdmin(req)) {
		const querySiteId = parseQuerySiteId(req);
		return querySiteId ? { [relationName]: { siteId: querySiteId } } : {};
	}

	const siteId = getAdminSiteId(req);
	return siteId ? { [relationName]: { siteId } } : { [relationName]: { siteId: -1 } };
}

/**
 * Resolve the site that a write operation should target.
 * - site-scoped admin: always their own site, explicit value is ignored
 * - super_admin: explicit value is required (body.siteId or query.siteId)
 */
function resolveWriteSiteId(req, explicitSiteId) {
	if (!isSuperAdmin(req)) {
		const siteId = getAdminSiteId(req);
		if (!siteId) {
			throw Object.assign(new Error('Akses ditolak. Admin belum memiliki site yang ditugaskan.'), {
				statusCode: 403,
			});
		}
		return siteId;
	}

	const candidate = explicitSiteId != null && explicitSiteId !== '' ? Number(explicitSiteId) : parseQuerySiteId(req);

	if (!Number.isInteger(candidate) || candidate <= 0) {
		throw Object.assign(new Error('siteId wajib diisi.'), { statusCode: 400 });
	}

	return candidate;
}

function siteNotFound(res) {
	return res.status(404).json({ message: 'Data tidak ditemukan.' });
}

export {
	SAFE_METHODS,
	buildRelationSiteWhere,
	buildSiteWhere,
	getAdminSiteId,
	isSafeMethod,
	isSuperAdmin,
	parseQuerySiteId,
	resolveWriteSiteId,
	siteNotFound,
};
