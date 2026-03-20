import { Router } from 'express';

import prisma from '../lib/prisma.js';
import { getLeaveRequestOrThrow, mapLeaveRequestDetail, mapLeaveRequestSummary } from '../lib/leaveWorkflow.js';

const router = Router();

function withAsync(handler) {
	return (req, res, next) => {
		Promise.resolve(handler(req, res, next)).catch(next);
	};
}

router.get(
	'/flow',
	withAsync(async (_req, res) => {
		const rows = await prisma.employeeLeave.findMany({
			include: {
				employee: true,
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
		return res.json(mapLeaveRequestDetail(record));
	}),
);

export default router;
