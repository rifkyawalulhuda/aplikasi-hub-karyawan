import { Router } from 'express';

import prisma from '../lib/prisma.js';
import { getLeaveRequestOrThrow, mapLeaveRequestDetail, mapLeaveRequestSummary } from '../lib/leaveWorkflow.js';
import requireSiteIsolation from '../middleware/requireSiteIsolation.js';

const router = Router();

router.use(requireSiteIsolation({ modelType: 'per-site' }));

function withAsync(handler) {
	return (req, res, next) => {
		Promise.resolve(handler(req, res, next)).catch(next);
	};
}

router.get(
	'/flow',
	withAsync(async (req, res) => {
		const employeeSiteFilter = req.isSuperAdmin ? {} : { employee: { siteId: req.admin.siteId } };

		const rows = await prisma.employeeLeave.findMany({
			where: {
				...employeeSiteFilter,
			},
			include: {
				employee: {
					include: {
						site: true,
						department: true,
						jobLevel: true,
					},
				},
				masterCutiKaryawan: true,
				replacementAssignments: {
					include: {
						replacementEmployee: true,
					},
				},
				approvals: {
					include: {
						approverEmployee: true,
					},
				},
			},
			orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
		});

		return res.json(rows.map(mapLeaveRequestSummary));
	}),
);

router.get(
	'/flow/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const record = await getLeaveRequestOrThrow(prisma, id);

		if (!req.isSuperAdmin && record.employee.siteId !== req.admin.siteId) {
			return res.status(403).json({
				message: 'Akses ditolak. Data tidak termasuk dalam site Anda.',
			});
		}

		return res.json(mapLeaveRequestDetail(record));
	}),
);

export default router;
