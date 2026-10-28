import { isSafeMethod } from '../lib/siteScope.js';

/**
 * Blocks mutating requests from the read-only "user" role.
 * The "admin" and "super_admin" roles keep full write access inside their scope.
 */
function requireWriteRole(req, res, next) {
	if (isSafeMethod(req.method)) {
		return next();
	}

	if (req.admin?.role === 'user') {
		return res.status(403).json({
			message: 'Akses ditolak. Role user hanya dapat membaca data.',
		});
	}

	return next();
}

export default requireWriteRole;
