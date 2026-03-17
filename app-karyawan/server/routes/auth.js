import { Router } from 'express';

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
				password,
				employee: {
					employeeNo: {
						equals: nik,
						mode: 'insensitive',
					},
				},
			},
			include: {
				employee: true,
			},
		});

		if (!admin) {
			return res.status(401).json({ message: 'NIK atau password tidak valid.' });
		}

		return res.json({
			message: 'Login berhasil.',
			user: mapSession(admin),
		});
	} catch (error) {
		return next(error);
	}
});

export default router;
