import { Router } from 'express';

import prisma from '../lib/prisma.js';
import {
	buildEmployeePortalProfile,
	mapEmployeeGuidanceRecord,
	mapEmployeeWarningLetter,
} from '../lib/employeePortal.js';
import requireEmployeeAuth from '../middleware/requireEmployeeAuth.js';

const router = Router();

router.use(requireEmployeeAuth);

router.get('/dashboard', async (req, res, next) => {
	try {
		const [guidanceCount, warningLetterCount, guidanceRecords, warningLetters] = await Promise.all([
			prisma.guidanceRecord.count({
				where: { employeeId: req.employee.id },
			}),
			prisma.warningLetter.count({
				where: { employeeId: req.employee.id },
			}),
			prisma.guidanceRecord.findMany({
				where: { employeeId: req.employee.id },
				orderBy: [{ meetingDate: 'desc' }, { id: 'desc' }],
				take: 3,
			}),
			prisma.warningLetter.findMany({
				where: { employeeId: req.employee.id },
				include: {
					employee: {
						include: {
							department: true,
							jobRole: true,
							jobLevel: true,
						},
					},
					superiorEmployee: {
						include: {
							jobLevel: true,
						},
					},
				},
				orderBy: [{ letterDate: 'desc' }, { id: 'desc' }],
				take: 3,
			}),
		]);

		return res.json({
			profile: buildEmployeePortalProfile(req.employee),
			summary: {
				guidanceCount,
				warningLetterCount,
			},
			recentGuidanceRecords: guidanceRecords.map(mapEmployeeGuidanceRecord),
			recentWarningLetters: warningLetters.map(mapEmployeeWarningLetter),
		});
	} catch (error) {
		return next(error);
	}
});

router.get('/profile', async (req, res) => {
	return res.json(buildEmployeePortalProfile(req.employee));
});

router.get('/guidance-records', async (req, res, next) => {
	try {
		const records = await prisma.guidanceRecord.findMany({
			where: { employeeId: req.employee.id },
			orderBy: [{ meetingDate: 'desc' }, { id: 'desc' }],
		});

		return res.json(records.map(mapEmployeeGuidanceRecord));
	} catch (error) {
		return next(error);
	}
});

router.get('/warning-letters', async (req, res, next) => {
	try {
		const records = await prisma.warningLetter.findMany({
			where: { employeeId: req.employee.id },
			include: {
				employee: {
					include: {
						department: true,
						jobRole: true,
						jobLevel: true,
					},
				},
				superiorEmployee: {
					include: {
						jobLevel: true,
					},
				},
			},
			orderBy: [{ letterDate: 'desc' }, { id: 'desc' }],
		});

		return res.json(records.map(mapEmployeeWarningLetter));
	} catch (error) {
		return next(error);
	}
});

export default router;
