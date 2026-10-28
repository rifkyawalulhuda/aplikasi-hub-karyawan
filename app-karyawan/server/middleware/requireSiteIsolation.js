import { getAdminSiteId, isSuperAdmin } from '../lib/siteScope.js';

/**
 * Creates site isolation middleware for a specific route context.
 *
 * - per-site: admin is scoped to their own site; super_admin is unscoped.
 * - shared:   data is shared across sites, but a site-scoped admin must still
 *             have a site assigned (fail closed).
 *
 * @param {Object} options
 * @param {'per-site'|'shared'} options.modelType - Whether the route handles per-site or shared data
 * @returns {Function} Express middleware
 */
function requireSiteIsolation({ modelType = 'per-site' } = {}) {
	return function siteIsolationMiddleware(req, res, next) {
		req.isSuperAdmin = isSuperAdmin(req);
		req.adminSiteId = getAdminSiteId(req);

		// Super admin: no site restriction
		if (req.isSuperAdmin) {
			req.siteFilter = {};
			return next();
		}

		// Every non-super_admin must be assigned to a site, even for shared data.
		if (req.adminSiteId == null) {
			return res.status(403).json({
				message: 'Akses ditolak. Admin belum memiliki site yang ditugaskan.',
			});
		}

		// Shared master data: readable across sites, no row filtering needed.
		if (modelType === 'shared') {
			req.siteFilter = {};
			return next();
		}

		// Inject site filter for all downstream queries
		req.siteFilter = { siteId: req.adminSiteId };
		return next();
	};
}

export default requireSiteIsolation;
