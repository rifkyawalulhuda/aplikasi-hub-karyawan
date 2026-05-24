/**
 * Creates site isolation middleware for a specific route context.
 * @param {Object} options
 * @param {'per-site'|'shared'} options.modelType - Whether the route handles per-site or shared data
 * @returns {Function} Express middleware
 */
function requireSiteIsolation({ modelType = 'per-site' } = {}) {
	return function siteIsolationMiddleware(req, res, next) {
		const { role, siteId } = req.admin;

		// Shared master data: no filtering needed
		if (modelType === 'shared') {
			req.siteFilter = {};
			return next();
		}

		// Super admin: no site restriction
		if (role === 'super_admin') {
			req.siteFilter = {};
			req.isSuperAdmin = true;
			return next();
		}

		// Site-scoped admin: validate siteId exists
		if (siteId == null) {
			return res.status(403).json({
				message: 'Akses ditolak. Admin belum memiliki site yang ditugaskan.',
			});
		}

		// Inject site filter for all downstream queries
		req.siteFilter = { siteId };
		req.isSuperAdmin = false;
		return next();
	};
}

export default requireSiteIsolation;
