import { Router } from 'express';

import prisma from '../lib/prisma.js';
import { mapEmployeePortalSession, normalizeString } from '../lib/employeePortal.js';
import { createEmployeeAccessToken } from '../lib/employeeSession.js';

const router = Router();

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

		const employee = await prisma.employee.findFirst({
			where: {
				password,
				employeeNo: {
					equals: nik,
					mode: 'insensitive',
				},
			},
			include: {
				department: true,
				jobLevel: true,
			},
		});

		if (!employee) {
			return res.status(401).json({ message: 'NIK atau password tidak valid.' });
		}

		const { token, expiresAt } = createEmployeeAccessToken(employee);

		return res.json({
			message: 'Login berhasil.',
			tokenType: 'Bearer',
			accessToken: token,
			expiresAt,
			user: mapEmployeePortalSession(employee),
		});
	} catch (error) {
		return next(error);
	}
});

export default router;
