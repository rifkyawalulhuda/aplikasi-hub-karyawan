import prisma from '../lib/prisma.js';
import { verifyEmployeeAccessToken } from '../lib/employeeSession.js';

async function requireEmployeeAuth(req, res, next) {
	try {
		const authorizationHeader = req.headers.authorization || '';
		const [scheme, token] = authorizationHeader.split(' ');

		if (scheme !== 'Bearer' || !token) {
			return res.status(401).json({ message: 'Akses ditolak. Silakan login terlebih dahulu.' });
		}

		const payload = verifyEmployeeAccessToken(token);
		const employee = await prisma.employee.findUnique({
			where: { id: Number(payload.sub) },
			include: {
				department: true,
				workLocation: true,
				jobRole: true,
				jobLevel: true,
			},
		});

		if (!employee) {
			return res.status(401).json({ message: 'Akun karyawan tidak ditemukan.' });
		}

		req.employee = employee;
		return next();
	} catch (error) {
		const status = error?.statusCode || 401;
		return res.status(status).json({
			message: error?.message || 'Akses ditolak. Silakan login kembali.',
		});
	}
}

export default requireEmployeeAuth;
