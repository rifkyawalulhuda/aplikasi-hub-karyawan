function requireSuperAdmin(req, res, next) {
	if (req.admin.role !== 'super_admin') {
		return res.status(403).json({
			message: 'Akses ditolak. Hanya Super Admin yang dapat mengelola Site.',
		});
	}
	return next();
}

export default requireSuperAdmin;
