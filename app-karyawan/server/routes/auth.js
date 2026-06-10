import { Router } from 'express';

import { createAdminAccessToken } from '../lib/adminSession.js';
import { hashPassword, needsPasswordHash, verifyPassword } from '../lib/password.js';
import prisma from '../lib/prisma.js';

const router = Router();

function normalizeString(value = '') {
	return String(value).trim();
}

function mapSession(record) {
	return {
		id: record.id,
		role: record.role,
		employeeId: record.employeeId,
		name: record.employee.fullName,
		nik: record.employee.employeeNo,
		siteId: record.siteId,
		siteName: record.site?.name,
	};
}

router.post('/login', async (req, res, next) => {
	try {
		const nik = normalizeString(req.body?.nik);
		const password = normalizeString(req.body?.password);

		if (!nik) {
			return res.status(400).json({ message: 'NIK wajib diisi.' });
		}

		if (!password) {
			return res.status(400).json({ message: 'Password wajib diisi.' });
		}

		const admin = await prisma.masterAdmin.findFirst({
			where: {
				employee: {
					employeeNo: {
						equals: nik,
						mode: 'insensitive',
					},
				},
			},
			include: {
				employee: true,
				site: true,
			},
		});

		if (!admin || !(await verifyPassword(password, admin.password))) {
			return res.status(401).json({ message: 'NIK atau password tidak valid.' });
		}

		if (needsPasswordHash(admin.password)) {
			await prisma.masterAdmin.update({
				where: { id: admin.id },
				data: {
					password: await hashPassword(password),
				},
			});
		}

		const { token, expiresAt } = createAdminAccessToken(admin);

		return res.json({
			message: 'Login berhasil.',
			tokenType: 'Bearer',
			accessToken: token,
			expiresAt,
			user: mapSession(admin),
		});
	} catch (error) {
		return next(error);
	}
});

export default router;
