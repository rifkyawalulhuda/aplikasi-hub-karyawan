import { isSafeMethod } from '../lib/siteScope.js';

/**
 * Reference master data (JobLevel, MasterDokPkb, MasterCutiKaryawan, MasterHoliday,
 * MasterDokKaryawan) is readable by every site but only writable by super_admin.
 */
function requireSuperAdminWrite(req, res, next) {
	if (isSafeMethod(req.method)) {
		return next();
	}

	if (req.admin?.role !== 'super_admin') {
		return res.status(403).json({
			message: 'Akses ditolak. Hanya Super Admin yang dapat mengubah data referensi global.',
		});
	}

	return next();
}

export default requireSuperAdminWrite;
