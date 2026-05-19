import prisma from '../lib/prisma.js';
import { verifyAdminAccessToken } from '../lib/adminSession.js';

async function requireAdminAuth(req, res, next) {
	try {
		const authorizationHeader = req.headers.authorization || '';
		const [scheme, token] = authorizationHeader.split(' ');

		if (scheme !== 'Bearer' || !token) {
			return res.status(401).json({ message: 'Akses ditolak. Silakan login admin terlebih dahulu.' });
		}

		const payload = verifyAdminAccessToken(token);
		const admin = await prisma.masterAdmin.findUnique({
			where: { id: Number(payload.sub) },
			include: {
				employee: true,
			},
		});

		if (!admin) {
			return res.status(401).json({ message: 'Akun admin tidak ditemukan.' });
		}

		req.admin = {
			id: admin.id,
			role: admin.role,
			employeeId: admin.employeeId,
			employee: admin.employee,
		};

		return next();
	} catch (error) {
		const status = error?.statusCode || 401;
		return res.status(status).json({
			message: error?.message || 'Akses ditolak. Silakan login kembali.',
		});
	}
}

export default requireAdminAuth;
